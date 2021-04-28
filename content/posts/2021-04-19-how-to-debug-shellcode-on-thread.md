+++
title = "特定のスレッドで動くシェルコードをデバッグしたい"
template = "page.html"
date = 2021-04-19T21:00:00Z
slug = "how-to-debug-shellcode-on-thread"
[taxonomies]
tags = ["shellcode", "debug"]
[extra]
summary = " "
image0 = "./images/2021-03-28-get-syscall-number-dynamically-0.png"
+++

### 概要

シェルコードをスレッドや、リモートスレッドで動かす時に、デバッガーを使ってデバッグしたい時がありました。

デバッガーの扱いに慣れていなかったので、やり方がよくわからなかったのですが、なんか適当に触ってたら[x64dbg](https://x64dbg.com/)で簡単にできました。

やり方は、シェルコードを実行するスレッドを一時停止状態で作成するだけです。

ここでは`notepad.exe`にリモートスレッドを作成したと仮定します。

`notepad.exe`を起動し、リモートスレッドを作成したら、x64dbgを開き、左上のファイルからアタッチを押すか<kbd>Alt+A</kbd>でアタッチウィンドウを開きます。

`Search:`で`notepad`と入力してフィルターします。

![2021-03-28-get-syscall-number-dynamically-0.png](../2021-03-28-get-syscall-number-dynamically-0.png)

`notepad`にアタッチ出来たら、スレッドタブを開いて、作成したスレッドのスレッドIDを探し、右クリックから`Go To Thread Entry`をクリックします。

![2021-03-28-get-syscall-number-dynamically-1.png](../2021-03-28-get-syscall-number-dynamically-1.png)

これでCPUタブに戻るので、デバッグする準備が出来ました。

スレッドをResumeして、実際にデバッグしてみてください。

