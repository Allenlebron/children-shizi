export function supportsSpeechSynthesis() {
  if (typeof window === 'undefined') {
    return false
  }

  return Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance)
}

export function speak(text: string) {
  if (!text || !supportsSpeechSynthesis()) {
    return false
  }

  const synthesis = window.speechSynthesis
  const Utterance = window.SpeechSynthesisUtterance

  synthesis.cancel()
  synthesis.speak(new Utterance(text))
  return true
}
