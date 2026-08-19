# Fix flashcard counter after Shuffle

## Problem

After shuffling, the counter always restarts at "Card 1 of 11" even though a different card is displayed, which looks like the deck is stuck.

## Change

The counter should show the card's original (unshuffled) number, not the position in the shuffled order. So if a shuffle lands on the 6th card of the original deck, the label reads "Card 6 of 11".

- Update `src/components/learningHub/FlashcardDeck.tsx` so the label uses the current card's original index (`order[position] + 1`) instead of `position + 1`.
- Total stays the deck size.
- Shuffle, Next/Previous and Restart behaviour otherwise unchanged; Restart returns to the original order starting at Card 1.
