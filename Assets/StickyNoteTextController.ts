@component
export class StickyNoteTextController extends BaseScriptComponent {
  @input
  private textComponent: Text

  @input
  private backgroundMesh: RenderMeshVisual

  @input("string", "Click to edit...")
  private defaultText: string = "Click to edit..."

  @input("number", "32")
  private maxFontSize: number = 32

  @input("number", "12")
  private minFontSize: number = 12

  @input("number", "50")
  private maxCharacters: number = 50

  @input("boolean", "true")
  private enableEditing: boolean = true

  @input("boolean", "true")
  private randomizeColorOnStart: boolean = true

  @input("boolean", "true")
  private enableTypewriterEffect: boolean = true

  @input("number", "0.05")
  private typingSpeedSeconds: number = 0.05

  @input("number", "0.3")
  private cursorBlinkSpeed: number = 0.3

  // Predefined sticky note colors (pleasing pastel colors)
  private stickyNoteColors: vec4[] = [
    new vec4(1.0, 1.0, 0.7, 1.0),   // Light Yellow (classic sticky note)
    new vec4(1.0, 0.9, 0.7, 1.0),   // Light Orange
    new vec4(0.9, 1.0, 0.7, 1.0),   // Light Green
    new vec4(0.7, 0.9, 1.0, 1.0),   // Light Blue
    new vec4(1.0, 0.8, 0.9, 1.0),   // Light Pink
    new vec4(0.9, 0.8, 1.0, 1.0),   // Light Purple
    new vec4(1.0, 0.95, 0.8, 1.0),  // Light Peach
    new vec4(0.8, 1.0, 0.9, 1.0),   // Light Mint
    new vec4(0.95, 0.95, 0.8, 1.0), // Light Cream
    new vec4(0.85, 0.95, 1.0, 1.0)  // Light Sky Blue
  ]

  // Predefined text options for cycling
  private textOptions: string[] = [
    "Remember this!",
    "Important meeting at 3pm",
    "Buy groceries",
    "Call mom",
    "Project deadline Friday",
    "Take a break",
    "Great idea!",
    "Follow up on this",
    this.defaultText
  ]

  private currentTextIndex: number = 0

  // Typewriter animation variables
  private targetText: string = ""
  private currentCharIndex: number = 0
  private isTyping: boolean = false
  private typingEvent: DelayedCallbackEvent | null = null
  private cursorBlinkEvent: DelayedCallbackEvent | null = null
  private showCursor: boolean = true

  onAwake() {
    if (!this.textComponent) {
      print("StickyNoteTextController: Text component not assigned!")
      return
    }

    // Set random color if enabled
    if (this.randomizeColorOnStart) {
      this.setRandomColor()
    }

    // Ensure text is always black
    this.ensureTextColorIsBlack()

    // Set initial text (with animation if enabled)
    if (this.enableTypewriterEffect) {
      this.startTypingAnimation(this.defaultText)
    } else {
      this.updateText(this.defaultText)
    }
    
    // Setup interaction if editing is enabled
    if (this.enableEditing) {
      this.setupInteraction()
    }

    // Ensure text fits properly on start
    this.createEvent("OnStartEvent").bind(() => {
      this.ensureTextFits()
    })
  }

  private setRandomColor() {
    if (!this.backgroundMesh) {
      // Try to find the background mesh if not assigned
      this.backgroundMesh = this.sceneObject.getComponent("RenderMeshVisual")
    }

    if (this.backgroundMesh && this.backgroundMesh.mainMaterial) {
      const randomIndex = Math.floor(Math.random() * this.stickyNoteColors.length)
      const randomColor = this.stickyNoteColors[randomIndex]
      
      // Set the base color of the material
      this.backgroundMesh.mainMaterial.mainPass.baseColor = randomColor
      
      print(`Sticky note color set to: ${randomColor.x}, ${randomColor.y}, ${randomColor.z}`)
    } else {
      print("StickyNoteTextController: Background mesh or material not found!")
    }
  }

  private ensureTextColorIsBlack() {
    if (this.textComponent && this.textComponent.textFill) {
      // Ensure text is always black
      this.textComponent.textFill.color = new vec4(0.0, 0.0, 0.0, 1.0)
    }
  }

  private setupInteraction() {
    // Create a tap event to cycle through text options
    const tapEvent = this.createEvent("TapEvent")
    tapEvent.bind(() => {
      this.cycleText()
    })
  }

  private cycleText() {
    this.currentTextIndex = (this.currentTextIndex + 1) % this.textOptions.length
    const newText = this.textOptions[this.currentTextIndex]
    
    if (this.enableTypewriterEffect) {
      this.startTypingAnimation(newText)
    } else {
      this.updateText(newText)
    }
  }

  /**
   * Start the typewriter animation for new text
   */
  public startTypingAnimation(newText: string) {
    // Stop any existing typing animation
    this.stopTypingAnimation()

    // Limit text length
    let processedText = newText
    if (processedText.length > this.maxCharacters) {
      processedText = processedText.substring(0, this.maxCharacters) + "..."
    }

    this.targetText = processedText
    this.currentCharIndex = 0
    this.isTyping = true

    // Clear current text and start typing
    this.textComponent.text = ""
    this.ensureTextColorIsBlack()

    // Start cursor blinking
    this.startCursorBlink()

    // Start typing the first character
    this.typeNextCharacter()
  }

  private typeNextCharacter() {
    if (!this.isTyping || this.currentCharIndex >= this.targetText.length) {
      // Typing completed
      this.isTyping = false
      this.stopCursorBlink()
      this.textComponent.text = this.targetText
      this.ensureTextColorIsBlack()
      this.ensureTextFits()
      return
    }

    // Add the next character
    this.currentCharIndex++
    const currentText = this.targetText.substring(0, this.currentCharIndex)
    
    // Add cursor if it should be shown
    const displayText = this.showCursor ? currentText + "|" : currentText
    this.textComponent.text = displayText
    this.ensureTextColorIsBlack()

    // Schedule next character
    this.typingEvent = this.createEvent("DelayedCallbackEvent")
    this.typingEvent.bind(() => {
      this.typeNextCharacter()
    })
    this.typingEvent.reset(this.typingSpeedSeconds)
  }

  private startCursorBlink() {
    this.showCursor = true
    this.blinkCursor()
  }

  private blinkCursor() {
    if (!this.isTyping) return

    this.showCursor = !this.showCursor
    
    // Update display with or without cursor
    if (this.currentCharIndex < this.targetText.length) {
      const currentText = this.targetText.substring(0, this.currentCharIndex)
      const displayText = this.showCursor ? currentText + "|" : currentText
      this.textComponent.text = displayText
      this.ensureTextColorIsBlack()
    }

    // Schedule next blink
    this.cursorBlinkEvent = this.createEvent("DelayedCallbackEvent")
    this.cursorBlinkEvent.bind(() => {
      this.blinkCursor()
    })
    this.cursorBlinkEvent.reset(this.cursorBlinkSpeed)
  }

  private stopCursorBlink() {
    if (this.cursorBlinkEvent) {
      this.cursorBlinkEvent.enabled = false
      this.cursorBlinkEvent = null
    }
    this.showCursor = false
  }

  private stopTypingAnimation() {
    this.isTyping = false
    
    if (this.typingEvent) {
      this.typingEvent.enabled = false
      this.typingEvent = null
    }
    
    this.stopCursorBlink()
  }

  /**
   * Update the sticky note text with proper boundary checking
   */
  public updateText(newText: string) {
    if (!this.textComponent) return

    // Stop any ongoing animation
    this.stopTypingAnimation()

    // Limit text length
    let processedText = newText
    if (processedText.length > this.maxCharacters) {
      processedText = processedText.substring(0, this.maxCharacters) + "..."
    }

    this.textComponent.text = processedText
    
    // Ensure text stays black after updates
    this.ensureTextColorIsBlack()
    
    // Ensure the text fits within bounds
    this.ensureTextFits()
  }

  /**
   * Update text from websocket with typing animation
   * This is the main method to call when receiving text from websocket
   */
  public setTextFromWebsocket(newText: string) {
    if (this.enableTypewriterEffect) {
      this.startTypingAnimation(newText)
    } else {
      this.updateText(newText)
    }
  }

  /**
   * Dynamically adjust font size to ensure text fits within the sticky note bounds
   */
  private ensureTextFits() {
    if (!this.textComponent) return

    // Start with max font size and decrease if needed
    let fontSize = this.maxFontSize
    this.textComponent.size = fontSize

    // Wait a frame for layout to update, then check if text fits
    this.createEvent("DelayedCallbackEvent").bind(() => {
      this.checkAndAdjustTextSize()
    })
  }

  private checkAndAdjustTextSize() {
    if (!this.textComponent) return

    // If text is overflowing and we can reduce font size, do so
    let fontSize = this.textComponent.size
    
    // Simple heuristic: if text is too long, reduce font size
    const textLength = this.textComponent.text.length
    const layoutWidth = this.textComponent.worldSpaceRect.right - this.textComponent.worldSpaceRect.left
    const layoutHeight = this.textComponent.worldSpaceRect.top - this.textComponent.worldSpaceRect.bottom
    
    // Estimate if text will fit based on character count and layout area
    const estimatedArea = textLength * fontSize * fontSize * 0.6 // rough estimate
    const availableArea = layoutWidth * layoutHeight
    
    if (estimatedArea > availableArea && fontSize > this.minFontSize) {
      // Reduce font size
      const newFontSize = Math.max(
        this.minFontSize, 
        Math.floor(fontSize * Math.sqrt(availableArea / estimatedArea))
      )
      this.textComponent.size = newFontSize
    }
  }

  /**
   * Set custom text (can be called from other scripts)
   */
  public setCustomText(text: string) {
    if (this.enableTypewriterEffect) {
      this.startTypingAnimation(text)
    } else {
      this.updateText(text)
    }
  }

  /**
   * Get current text
   */
  public getCurrentText(): string {
    return this.textComponent ? this.textComponent.text : ""
  }

  /**
   * Add a new text option to the cycle
   */
  public addTextOption(text: string) {
    if (this.textOptions.indexOf(text) === -1) {
      this.textOptions.splice(-1, 0, text) // Insert before the default text
    }
  }

  /**
   * Reset to default text
   */
  public resetText() {
    this.currentTextIndex = this.textOptions.length - 1 // Default text is last
    if (this.enableTypewriterEffect) {
      this.startTypingAnimation(this.defaultText)
    } else {
      this.updateText(this.defaultText)
    }
  }

  /**
   * Manually set a specific color for the sticky note
   */
  public setStickyNoteColor(color: vec4) {
    if (this.backgroundMesh && this.backgroundMesh.mainMaterial) {
      this.backgroundMesh.mainMaterial.mainPass.baseColor = color
    }
  }

  /**
   * Randomize the color again (can be called externally)
   */
  public randomizeColor() {
    this.setRandomColor()
  }

  /**
   * Enable or disable typewriter effect
   */
  public setTypewriterEffect(enabled: boolean) {
    this.enableTypewriterEffect = enabled
    if (!enabled) {
      this.stopTypingAnimation()
    }
  }

  /**
   * Set typing speed (seconds per character)
   */
  public setTypingSpeed(speed: number) {
    this.typingSpeedSeconds = Math.max(0.01, speed) // Minimum speed limit
  }
} 