+++
title = "works"
template = "index.html"
paginate_by = 0
+++

## 開発したものとか。

こいついっつもしょーもないもの作ってんな！

---

#### [blackcat-rs](https://github.com/2vg/blackcat-rs)
Rustで悪意のある技術を実装していくリポジトリ。</br>
CやC++の遺産を使わず、純粋なRustのみで実装していくのがきもちい。

#### [homochecker-jockey](https://github.com/2vg/homochecker-jockey)
Rustで実装された[chitoku-k/HomoChecker](https://github.com/chitoku-k/HomoChecker)...の全くの偽物。なんならマルウェアだし。</br>
UACバイパスを使用し、ルート証明書として勝手にクソ証明書を配置した後、システムプロキシの設定を勝手に変更し、MITMプロキシーサーバーを建てて全てのブラウザのリクエストをMITMプロキシーサーバーにリダイレクトさせる。</br>
が、別にログなどを記録して外部に送信するような機能はなく、リクエスト時のUser-Agentを勝手に`Homozilla/5.0 (Checker/1.14.514; homOSeX 8.10)`に書き換えるだけ。</br>
私は何を作っているのだろうか。そのうち病院へ行かないといけないかもしれない。

#### [gameserver-sandbox-rs](https://github.com/2vg/gameserver-sandbox-rs)
Rustでゲームサーバー作りたくね？って思い立った時の、練習サンドボックスリポジトリ。</br>
ActixとSledを使用し、Websocket通信を用いて通信するだけ。</br>
DDDの練習もかねてそれっぽいファイル構造にしてみたけど、よくわからなかった。DDDはむずかしい。

#### [mofuw](https://github.com/2vg/mofuw)
Nimで作成された高速で使いやすい(しらんけど)Webフレームワーク。</br>
当時はTechEmpowerのベンチマークでTOPを争うくらいのレベルで高速でした。</br>
今はビルドすら出来ず、自分でも何かいてるかコード読めん。どうやってマクロ書いたんだ？

#### [mofuparser](https://github.com/2vg/mofuparser)
Nimで作成された(Nimの中では)一番高速なHTTPパーサー。</br>
リクエストのパースのみをサポート。</br>
SIMDを使っているので、めちゃくちゃ早い！([httparse](https://github.com/seanmonstar/httparse)からマルコピしたなんて言えない)

#### [Nim-World](https://github.com/2vg/Nim-World)
Nim言語についての日本語ドキュメント。</br>
中途半端なとこまでしか書いてないけど、基礎中の基礎くらいまでは習得できるはず。</br>
もちろんもうメンテしてない。今はNimやってないし...

---

他のものは[GitHub](https://github.com/2vg)見て
