export interface CaptureLocale {
  instruction: string;
  processing: string;
  initializing: string;
  close: string;
  tryAgain: string;
  maxRetries: string;
}

const captureLocales: Record<string, CaptureLocale> = {
  'English': {
    instruction: 'Click and drag to select an area. Press ESC to cancel.',
    processing: 'Processing capture...',
    initializing: 'Initializing screen capture...',
    close: 'Close',
    tryAgain: 'Try Again',
    maxRetries: 'Maximum retry attempts reached. Please close and try again.',
  },
  'Russian': {
    instruction: 'Нажмите и перетащите, чтобы выбрать область. Нажмите ESC для отмены.',
    processing: 'Обработка захвата...',
    initializing: 'Инициализация захвата экрана...',
    close: 'Закрыть',
    tryAgain: 'Повторить',
    maxRetries: 'Достигнуто максимальное число попыток. Закройте и попробуйте снова.',
  },
  'Ukrainian': {
    instruction: 'Натисніть і перетягніть, щоб вибрати область. Натисніть ESC для скасування.',
    processing: 'Обробка захоплення...',
    initializing: 'Ініціалізація захоплення екрана...',
    close: 'Закрити',
    tryAgain: 'Повторити',
    maxRetries: 'Досягнуто максимальної кількості спроб. Закрийте та спробуйте знову.',
  },
  'Spanish': {
    instruction: 'Haz clic y arrastra para seleccionar un área. Pulsa ESC para cancelar.',
    processing: 'Procesando captura...',
    initializing: 'Inicializando captura de pantalla...',
    close: 'Cerrar',
    tryAgain: 'Intentar de nuevo',
    maxRetries: 'Número máximo de intentos alcanzado. Por favor cierra e inténtalo de nuevo.',
  },
  'French': {
    instruction: 'Cliquez et faites glisser pour sélectionner une zone. Appuyez sur ESC pour annuler.',
    processing: 'Traitement de la capture...',
    initializing: "Initialisation de la capture d'écran...",
    close: 'Fermer',
    tryAgain: 'Réessayer',
    maxRetries: 'Nombre maximum de tentatives atteint. Veuillez fermer et réessayer.',
  },
  'German': {
    instruction: 'Klicken und ziehen, um einen Bereich auszuwählen. ESC zum Abbrechen.',
    processing: 'Aufnahme wird verarbeitet...',
    initializing: 'Bildschirmaufnahme wird initialisiert...',
    close: 'Schließen',
    tryAgain: 'Erneut versuchen',
    maxRetries: 'Maximale Anzahl an Versuchen erreicht. Bitte schließen und erneut versuchen.',
  },
  'Italian': {
    instruction: "Clicca e trascina per selezionare un'area. Premi ESC per annullare.",
    processing: 'Elaborazione acquisizione...',
    initializing: 'Inizializzazione acquisizione schermo...',
    close: 'Chiudi',
    tryAgain: 'Riprova',
    maxRetries: 'Numero massimo di tentativi raggiunto. Chiudi e riprova.',
  },
  'Portuguese': {
    instruction: 'Clique e arraste para selecionar uma área. Pressione ESC para cancelar.',
    processing: 'Processando captura...',
    initializing: 'Inicializando captura de tela...',
    close: 'Fechar',
    tryAgain: 'Tentar novamente',
    maxRetries: 'Número máximo de tentativas atingido. Feche e tente novamente.',
  },
  'Chinese (Simplified)': {
    instruction: '点击并拖动以选择区域。按 ESC 取消。',
    processing: '正在处理截图...',
    initializing: '正在初始化屏幕截图...',
    close: '关闭',
    tryAgain: '重试',
    maxRetries: '已达到最大重试次数。请关闭后重试。',
  },
  'Japanese': {
    instruction: 'クリックしてドラッグしてエリアを選択します。ESCでキャンセル。',
    processing: 'キャプチャを処理中...',
    initializing: '画面キャプチャを初期化中...',
    close: '閉じる',
    tryAgain: '再試行',
    maxRetries: '最大試行回数に達しました。閉じてもう一度お試しください。',
  },
  'Korean': {
    instruction: '클릭하고 드래그하여 영역을 선택하세요. ESC를 눌러 취소.',
    processing: '캡처 처리 중...',
    initializing: '화면 캡처 초기화 중...',
    close: '닫기',
    tryAgain: '다시 시도',
    maxRetries: '최대 재시도 횟수에 도달했습니다. 닫고 다시 시도하세요.',
  },
  'Polish': {
    instruction: 'Kliknij i przeciągnij, aby wybrać obszar. Naciśnij ESC, aby anulować.',
    processing: 'Przetwarzanie przechwytywania...',
    initializing: 'Inicjowanie przechwytywania ekranu...',
    close: 'Zamknij',
    tryAgain: 'Spróbuj ponownie',
    maxRetries: 'Osiągnięto maksymalną liczbę prób. Zamknij i spróbuj ponownie.',
  },
};

export function getCaptureLocale(lang: string | undefined): CaptureLocale {
  return (lang && captureLocales[lang]) ?? captureLocales['English'];
}
