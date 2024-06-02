import cv2
import numpy as np
import pyautogui
import pytesseract
from googletrans import Translator
import keyboard

# now let's initialize the list of reference point
drawing = False
start_x = -1
start_y = -1
image = None
clone = None
screen_area_selected = False
selection_thread = None

translator = Translator()

def shape_selection(event, x, y, flags, param):
    global start_x, start_y, drawing, image, screen_area_selected

    if event == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        start_x = x
        start_y = y

    elif event == cv2.EVENT_MOUSEMOVE:
        if drawing:
            image = clone.copy()
            cv2.rectangle(image, (start_x, start_y), (x, y), (0, 0, 255), 1)

    elif event == cv2.EVENT_LBUTTONUP:
        drawing = False
        screen_area_selected = True
        recognize_text(start_x, start_y, x, y)


def recognize_text(x1, y1, x2, y2):
    start_x = x1 if x1 < x2 else x2
    start_y = y1 if x1 < x2 else y2
    end_x = x1 if x1 > x2 else x2
    end_y = y1 if x1 > x2 else y2

    print(f'x1: {x1} y1: {y1}')
    print(f'x2: {x2} y2: {y2}\n')

    # Crop the image
    image = pyautogui.screenshot(region=(start_x, start_y, end_x-start_x, end_y-start_y))
    # Convert the image to grayscale
    image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)

    cv2.destroyAllWindows()
    # Recognize text using Tesseract
    recognized_text = pytesseract.image_to_string(image)
    # Display the recognized text in a window

    translated = translator.translate(recognized_text.replace('\n', ' '), dest='ru')

    text = f'Recognized:\n\n{recognized_text}\n\n--------------------------------------------------------------------------------------------\n\nTranslated:\n\n{translated.text}'

    pyautogui.alert(text=text, title='', button='OK')


def select_screen_area():
    global image, clone, screen_area_selected

    image = np.array(pyautogui.screenshot())
    image = cv2.cvtColor(np.array(image), cv2.COLOR_BGR2RGB)
    clone = image.copy()
    
    cv2.namedWindow("screenshot", cv2.WINDOW_NORMAL)
    cv2.setWindowProperty("screenshot", cv2.WND_PROP_TOPMOST, 1)
    cv2.setMouseCallback("screenshot", shape_selection)

    # Set the window to full screen
    cv2.setWindowProperty(
        "screenshot", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    screen_area_selected = False

    while not screen_area_selected:
        cv2.imshow("screenshot", image)
        key = cv2.waitKey(100)

        if key == 27:  # esc
            break
    cv2.destroyAllWindows()


print('Press ctrl+alt+t to start a translation.')
keyboard.add_hotkey('ctrl+alt+t', select_screen_area)
keyboard.wait()
