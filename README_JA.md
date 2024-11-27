# Chrome 拡張機能チャット

複数の Chrome 拡張機能間で多方向通信を可能にする拡張機能セットです。メッセージはローカルに保存され、拡張機能 A、B、C 間で交換できます。

[English](README.md) | [中文说明](README_CN.md)

## 機能

### Talk-A（紫バッジ）と Talk-B（緑バッジ）
- 拡張機能間でのメッセージの送受信
- 拡張機能アイコンのリアルタイムメッセージカウンターバッジ
- Chrome Storage API を使用したローカルメッセージ保存
- メッセージ操作機能：
  - 新規メッセージの送信
  - 個別メッセージの削除
  - 全メッセージの消去
  - メッセージ履歴の表示
- バッジカウンターの自動更新：
  - 新規メッセージ受信時
  - メッセージ削除時
  - 全メッセージ消去時

### Talk-C（オレンジバッジ）- 管理拡張機能
- Talk-A と Talk-B の中央管理インターフェース
- 両方の拡張機能からのメッセージを統合表示
- リアルタイムメッセージモニタリング
- メッセージ操作機能：
  - 両方の拡張機能からの全メッセージ表示
  - いずれかの拡張機能からのメッセージ削除
  - 両方の拡張機能からの全メッセージ消去
- 高度な機能：
  - 30秒ごとのバッジカウンター自動更新
  - ソース別メッセージフィルタリング（A または B）
  - 両方の拡張機能からの総メッセージ数表示
  - メッセージ変更時のリアルタイムバッジ更新

## バッジシステム
- Talk-A：紫バッジ (#9c27b0)、メッセージ数を表示
- Talk-B：緑バッジ (#4caf50)、メッセージ数を表示
- Talk-C：オレンジバッジ (#ff5722)、A と B からの総メッセージ数を表示

## インストール方法
1. このリポジトリをクローン
2. Chrome で `chrome://extensions/` にアクセス
3. "デベロッパーモード"を有効化
4. "パッケージ化されていない拡張機能を読み込む"をクリックし、`talk-a` フォルダを選択
5. ステップ4を繰り返し、`talk-b` フォルダを選択
6. ステップ4を繰り返し、`talk-c` フォルダを選択
7. 拡張機能IDをメモしてコードを更新

## 使用方法

### 基本操作
1. Chrome ツールバーの任意の拡張機能アイコン（Talk-A、Talk-B、または Talk-C）をクリック
2. 入力フィールドにメッセージを入力
3. "送信"をクリックして他の拡張機能にメッセージを送信
4. メッセージは全ての拡張機能のポップアップに表示されます

### メッセージ管理
- **メッセージの表示**：
  - Talk-A または Talk-B で各自のメッセージを表示
  - Talk-C で両方の拡張機能からのメッセージを表示
- **メッセージの削除**：
  - メッセージ横の"削除"ボタンで個別メッセージを削除
  - "全て消去"で全メッセージを削除
- **メッセージのフィルタリング**（Talk-C のみ）：
  - タブでソース別にメッセージをフィルタリング（全て/A/B）
- **バッジカウンター**：
  - 各拡張機能がアイコンにメッセージ数を表示
  - メッセージ変更時に数字が自動更新
  - Talk-C は A と B からの総メッセージ数を表示

## 技術詳細
- Chrome Extension Messaging API を使用した通信
- Chrome Storage API によるメッセージの永続化
- イベントリスナーによるリアルタイム更新
- 非同期メッセージ処理
- 拡張機能間通信のセキュリティ
- 自動バッジカウンター更新