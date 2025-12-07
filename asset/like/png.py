import sys
import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from PIL import Image

# 監視対象の画像拡張子
TARGET_EXTENSIONS = ['.jpg', '.jpeg', '.bmp', '.gif', '.tiff']

class ImageConversionHandler(FileSystemEventHandler):
    """
    ファイルシステムのイベントを処理するハンドラクラス
    """
    def __init__(self):
        super().__init__()
        # 新しく検出された画像ファイルのパスを格納するセット
        self.new_images = set()

    def on_created(self, event):
        """ファイルが作成されたときに呼ばれる"""
        self._process(event)

    def on_modified(self, event):
        """ファイルが変更されたときに呼ばれる"""
        self._process(event)

    def _process(self, event):
        """イベントを処理し、対象の画像ファイルであればセットに追加する"""
        if event.is_directory:
            return

        # ファイル名と拡張子を取得
        file_path = event.src_path
        _, ext = os.path.splitext(file_path)

        # 拡張子が監視対象のものであればリストに追加
        if ext.lower() in TARGET_EXTENSIONS:
            # 既に存在しないファイルは無視（移動や即時削除の場合があるため）
            if os.path.exists(file_path):
                self.new_images.add(file_path)
                print(f"[*] 新しい画像を検出しました: {os.path.basename(file_path)}")


def convert_images(image_paths, target_dir):
    """
    画像の変換処理を行う関数
    """
    print("\n--- PNGへの変換を開始します ---")
    converted_count = 0

    for image_path in list(image_paths): # セットのコピーをイテレート
        original_filename = os.path.basename(image_path)
        print(f"\n[対象ファイル] {original_filename}")

        new_name = ""
        while not new_name:
            try:
                # ユーザーに新しいファイル名を入力させる
                new_name_input = input("  新しいファイル名を入力してください（拡張子は不要）: ")
                if not new_name_input.strip():
                    print("  ファイル名が空です。もう一度入力してください。")
                    continue
                
                # 新しいPNGファイルのフルパスを作成
                new_png_path = os.path.join(target_dir, f"{new_name_input}.png")

                # もし同名のファイルが既に存在したら、再度入力を求める
                if os.path.exists(new_png_path):
                    print(f"  エラー: '{new_name_input}.png' は既に存在します。別の名前を入力してください。")
                    new_name = "" # ループを継続させる
                    continue

                new_name = new_name_input # 有効な名前として確定
            except KeyboardInterrupt:
                print("\n変換を中断しました。")
                return

        try:
            # 画像を開いてPNG形式で保存
            with Image.open(image_path) as img:
                img.save(new_png_path, 'PNG')
            print(f"  ✅ 変換成功: {os.path.basename(new_png_path)}")

            # 元のファイルを削除
            os.remove(image_path)
            print(f"  🗑️ 元ファイルを削除しました: {original_filename}")
            converted_count += 1

        except Exception as e:
            print(f"  ❌ エラー: {original_filename} の変換中に問題が発生しました。")
            print(f"     詳細: {e}")

    print(f"\n--- 完了: {converted_count}個のファイルを変換しました ---")


if __name__ == "__main__":
    # スクリプトが置かれているディレクトリを監視対象にする
    watch_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    print(f"監視ディレクトリ: {watch_dir}")
    print("JPG, JPEG, BMP, GIF, TIFF ファイルを監視します...")
    print("監視を終了するには Ctrl+C を押してください。")

    event_handler = ImageConversionHandler()
    observer = Observer()
    observer.schedule(event_handler, watch_dir, recursive=False)
    observer.start()

    try:
        while True:
            # 検出された画像があるかチェック
            if event_handler.new_images:
                print("\n----------------------------------------")
                print(f"{len(event_handler.new_images)}個の新しい画像が検出されました。")
                
                user_input = ""
                while user_input not in ['y', 'n']:
                    user_input = input("これらの画像をすべてPNGに変換しますか？ (y/n): ").lower()
                
                if user_input == 'y':
                    # 変換処理を実行
                    convert_images(event_handler.new_images, watch_dir)
                    # 処理済みのリストをクリア
                    event_handler.new_images.clear()
                else:
                    print("変換をスキップしました。リストをクリアします。")
                    # 処理しない場合もリストをクリアして再度尋ねないようにする
                    event_handler.new_images.clear()

            time.sleep(1)
    except KeyboardInterrupt:
        print("\nプログラムを終了します。")
    finally:
        observer.stop()
        observer.join()