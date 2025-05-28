@component
export class StickyNoteTextController extends BaseScriptComponent {
  @input
  private textComponent: Text

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

  onAwake() {
    if (!this.textComponent) {
      print("StickyNoteTextController: Text component not assigned!")
      return
    }

    // Set initial text
    this.updateText(this.defaultText)
    
    // Setup interaction if editing is enabled
    if (this.enableEditing) {
      this.setupInteraction()
    }

    // Ensure text fits properly on start
    this.createEvent("OnStartEvent").bind(() => {
      this.ensureTextFits()
    })
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
    this.updateText(newText)
  }

  /**
   * Update the sticky note text with proper boundary checking
   */
  public updateText(newText: string) {
    if (!this.textComponent) return

    // Limit text length
    let processedText = newText
    if (processedText.length > this.maxCharacters) {
      processedText = processedText.substring(0, this.maxCharacters) + "..."
    }

    this.textComponent.text = processedText
    
    // Ensure the text fits within bounds
    this.ensureTextFits()
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
    this.updateText(text)
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
    this.updateText(this.defaultText)
  }
} 