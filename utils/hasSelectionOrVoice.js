export const hasSelectionOrVoice = (selection, voiceText) => {
  const hasSelection = Array.isArray(selection)
    ? selection.length > 0
    : String(selection ?? '').trim().length > 0;

  return hasSelection || String(voiceText ?? '').trim().length > 0;
};
