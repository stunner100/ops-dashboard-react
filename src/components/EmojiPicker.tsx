import { useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
    position?: 'top' | 'bottom';
}

export function EmojiPicker({ onSelect, onClose, position = 'top' }: EmojiPickerProps) {
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleEmojiSelect = (emoji: { native: string }) => {
        onSelect(emoji.native);
    };

    return (
        <div
            ref={pickerRef}
            className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 z-50 animate-slide-up`}
        >
            <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
                perLine={8}
            />
        </div>
    );
}
