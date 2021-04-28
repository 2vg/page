+++
title = "動的にNt系関数のシステムコール番号を取得する"
template = "page.html"
date = 2021-03-28T21:30:00Z
slug = "get-syscall-number-dynamically"
[taxonomies]
tags = ["rust", "syscall"]
[extra]
summary = " "
+++

### 概要

AVやEDRによる`ntdll.dll`へのフックを回避する手法の一つに直接システムコールがあります。

これは事前にシステムコール番号を知っている必要があり、またWindowsのバージョンで番号が違うため、全てのWindowsのバージョンで動作するようにコーディングするにはそのためのデータが必要です。

それを全てデータ化しているサイトなどがありますが、もっとコンパクトな方法があります。

それは`ntdll.dll`のエクスポート関数を列挙し、`Zw`から始まる関数を昇順にソートすることです。

`Nt`系の関数は`ntdll.dll`内で順番に並んでいないため、`Nt`から始まる関数のサーチは意味がありませんが、`Zw`系の関数は、`Zw`より後に続くシンボルが昇順に並んでいるため、これを利用してシステムコール番号を取得することが出来ます。

### PoCコード

ロードされたDLLをパースするのに[m4b/goblin](https://github.com/m4b/goblin)を使用します。

処理のみを載せているので、そのままでは動きません。

```rust
let mut function_table = HashMap::new();

// x64ではgsセグメントレジスタの0x60にPEBが含まれている
let ppeb = __readgsqword(0x60) as *mut PEB
let p_peb_ldr_data = (*ppeb).Ldr;
let mut module_list =
    (*p_peb_ldr_data).InLoadOrderModuleList.Flink as *mut LDR_DATA_TABLE_ENTRY

while !(*module_list).DllBase.is_null() {
    let dll_base = (*module_list).DllBase;
    let size = (*module_list).SizeOfImage as usize
    module_list = (*module_list).InLoadOrderLinks.Flink as *mut LDR_DATA_TABLE_ENTRY
    let buffer = std::slice::from_raw_parts::<u8>(dll_base as _, size)

    // メモリ上に展開されているため、rvaを解決する必要はないのでオプションでOFFにする
    let opts = goblin::pe::options::ParseOptions { resolve_rva: false };
    let res = goblin::pe::PE::parse_with_opts(buffer, &opts)?;

    // ntdll.dllが見つかるまでスキップ
    if res.name != "ntdll.dll" {
        continue;
    }

    for e in parsed.exports {
        match e.name {
            Some(symbol) => {
                if symbol.len() < 2 {
                    continue;

                let sym_0 = symbol.chars().nth(0).unwrap();
                let sym_1 = symbol.chars().nth(1).unwrap()

                // 関数シンボルの1文字目と2文字目がZwかどうかチェック
                if (sym_0 == 'Z') && sym_1 == 'w' {
                    let mut function_name = symbol.to_string()
                    if symbol.chars().nth(0).unwrap() != 'N' {
                        // 後でNt...で参照できるようにNtに置き換える
                        function_name.replace_range(0..2, "Nt");
                    }
                    function_table.insert(function_name, e.offset);
                }
            }
            None => {}
        }

    let mut function_table_vec: Vec<(String, usize)> = function_table.into_iter().collect();

    // シンボル名で昇順にソート
    function_table_vec.sort_by(|x, y| x.1.cmp(&y.1));

    let mut syscall_table = HashMap::new()
    for (i, val) in function_table_vec.into_iter().enumerate() {
        syscall_table.insert(val.0, i);

    return Ok(syscall_table);
}
```

参考: [bypassing-user-mode-hooks-and-direct-invocation-of-system-calls-for-red-teams](https://www.mdsec.co.uk/2020/12/bypassing-user-mode-hooks-and-direct-invocation-of-system-calls-for-red-teams/)
