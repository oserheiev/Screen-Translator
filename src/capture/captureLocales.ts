export interface CaptureLocale {
  instruction: string;
  processing: string;
  initializing: string;
  close: string;
}

const captureLocales: Record<string, CaptureLocale> = {
  'English': {
    instruction: 'Click and drag to select an area. Press ESC to cancel.',
    processing: 'Processing capture...',
    initializing: 'Initializing screen capture...',
    close: 'Close',
  },
  'Russian': {
    instruction: 'Нажмите и перетащите, чтобы выбрать область. Нажмите ESC для отмены.',
    processing: 'Обработка захвата...',
    initializing: 'Инициализация захвата экрана...',
    close: 'Закрыть',
  },
  'Ukrainian': {
    instruction: 'Натисніть і перетягніть, щоб вибрати область. Натисніть ESC для скасування.',
    processing: 'Обробка захоплення...',
    initializing: 'Ініціалізація захоплення екрана...',
    close: 'Закрити',
  },
  'Spanish': {
    instruction: 'Haz clic y arrastra para seleccionar un área. Pulsa ESC para cancelar.',
    processing: 'Procesando captura...',
    initializing: 'Inicializando captura de pantalla...',
    close: 'Cerrar',
  },
  'French': {
    instruction: 'Cliquez et faites glisser pour sélectionner une zone. Appuyez sur ESC pour annuler.',
    processing: 'Traitement de la capture...',
    initializing: "Initialisation de la capture d'écran...",
    close: 'Fermer',
  },
  'German': {
    instruction: 'Klicken und ziehen, um einen Bereich auszuwählen. ESC zum Abbrechen.',
    processing: 'Aufnahme wird verarbeitet...',
    initializing: 'Bildschirmaufnahme wird initialisiert...',
    close: 'Schließen',
  },
  'Italian': {
    instruction: "Clicca e trascina per selezionare un'area. Premi ESC per annullare.",
    processing: 'Elaborazione acquisizione...',
    initializing: 'Inizializzazione acquisizione schermo...',
    close: 'Chiudi',
  },
  'Portuguese': {
    instruction: 'Clique e arraste para selecionar uma área. Pressione ESC para cancelar.',
    processing: 'Processando captura...',
    initializing: 'Inicializando captura de tela...',
    close: 'Fechar',
  },
  'Chinese (Simplified)': {
    instruction: '点击并拖动以选择区域。按 ESC 取消。',
    processing: '正在处理截图...',
    initializing: '正在初始化屏幕截图...',
    close: '关闭',
  },
  'Japanese': {
    instruction: 'クリックしてドラッグしてエリアを選択します。ESCでキャンセル。',
    processing: 'キャプチャを処理中...',
    initializing: '画面キャプチャを初期化中...',
    close: '閉じる',
  },
  'Korean': {
    instruction: '클릭하고 드래그하여 영역을 선택하세요. ESC를 눌러 취소.',
    processing: '캡처 처리 중...',
    initializing: '화면 캡처 초기화 중...',
    close: '닫기',
  },
  'Polish': {
    instruction: 'Kliknij i przeciągnij, aby wybrać obszar. Naciśnij ESC, aby anulować.',
    processing: 'Przetwarzanie przechwytywania...',
    initializing: 'Inicjowanie przechwytywania ekranu...',
    close: 'Zamknij',
  },
};

export function getCaptureLocale(lang: string | undefined): CaptureLocale {
  if (!lang) return captureLocales['English'];
  return captureLocales[lang] ?? captureLocales['English'];
}
