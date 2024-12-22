class TranslatorButton {
    constructor() {
        this.button = null;
        this.modal = null;
        this.selectedText = '';
        this.DEEPL_API_KEY = '16a3c365-275c-4b11-9ddf-ee75b421353b:fx';
        
        // Sesleri önceden yükle
        speechSynthesis.getVoices();
        // Chrome için ses yükleme eventi
        speechSynthesis.onvoiceschanged = () => {
            speechSynthesis.getVoices();
        };
        
        this.init();
    }

    init() {
        document.addEventListener('selectionchange', () => {
            setTimeout(() => this.handleSelection(), 100);
        });

        document.addEventListener('click', async (e) => {
            const button = e.target.closest('.translator-button');
            if (button) {
                console.log('Translate button clicked');
                try {
                    await this.showTranslationModal();
                } catch (error) {
                    console.error('Translation modal error:', error);
                }
            }
        });
    }

    handleSelection() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (this.button) {
            this.button.remove();
            this.button = null;
        }

        if (selectedText && selectedText.length > 0) {
            this.selectedText = selectedText;
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            const top = rect.bottom + window.scrollY;
            const left = rect.left + window.scrollX;

            this.showTranslateButton(left, top);
        }
    }

    showTranslateButton(x, y) {
        this.button = document.createElement('button');
        this.button.className = 'translator-button';
        this.button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
            </svg>
            Translate
        `;
        this.button.style.position = 'absolute';
        this.button.style.left = `${x}px`;
        this.button.style.top = `${y}px`;
        document.body.appendChild(this.button);
        
        console.log('Translate button created at:', x, y);
    }

    async translate(text) {
        try {
            // Storage'dan dili al
            const result = await browser.storage.sync.get(['targetLanguage']);
            const targetLang = result.targetLanguage || 'TR';

            const response = await fetch('https://api-free.deepl.com/v2/translate', {
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.DEEPL_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: [text],
                    source_lang: 'EN',
                    target_lang: targetLang,
                    formality: 'default'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.translations[0].text;
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    }

    async showTranslationModal() {
        try {
            const translation = await this.translate(this.selectedText);

            if (!translation) {
                throw new Error('Could not get translation');
            }

            const existingModal = document.querySelector('.translator-modal-overlay');
            if (existingModal) {
                existingModal.remove();
            }

            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = `
                <div class="translator-modal-overlay">
                    <div class="translator-modal">
                        <div class="translator-modal-header">
                            <h3>Translation</h3>
                            <button class="translator-modal-close">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                        <div class="translator-modal-content">
                            <p><strong>Selected Word:</strong> ${this.selectedText}</p>
                            <p><strong>Translation:</strong> ${translation}</p>
                            <div class="category-container">
                                <label for="category-select">Category</label>
                                <select id="category-select">
                                    <option value="">Select Category</option>
                                </select>
                            </div>
                        </div>
                        <div class="translator-modal-actions">
                            <button class="translator-button-secondary" id="speak-button">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                </svg>
                                Listen
                            </button>
                            <button class="translator-button-primary" id="save-button">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                                </svg>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modalContainer);

            const categories = await this.getCategories();
            const select = document.getElementById('category-select');

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });

            const closeBtn = modalContainer.querySelector('.translator-modal-close');
            const saveBtn = modalContainer.querySelector('#save-button');
            const speakBtn = modalContainer.querySelector('#speak-button');
            const overlay = modalContainer.querySelector('.translator-modal-overlay');

            closeBtn.addEventListener('click', () => {
                modalContainer.remove();
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    modalContainer.remove();
                }
            });

            speakBtn.addEventListener('click', () => {
                // Mevcut sesi durdur
                speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(this.selectedText);
                
                const voices = speechSynthesis.getVoices();
                
                const englishVoice = voices.find(voice => 
                    (voice.lang.includes('en-GB') || voice.lang.includes('en-US')) && 
                    voice.localService === true
                ) || voices.find(voice => 
                    voice.lang.includes('en')
                );

                if (englishVoice) {
                    utterance.voice = englishVoice;
                }

                utterance.lang = 'en-US';
                utterance.rate = 0.9;
                utterance.pitch = 1;
                utterance.volume = 0.8;

                utterance.onstart = () => {
                    speakBtn.disabled = true;
                    speakBtn.textContent = '🔊 Playing...';
                };

                utterance.onend = () => {
                    speakBtn.disabled = false;
                    speakBtn.textContent = '🔊 Listen';
                };

                speechSynthesis.speak(utterance);
            });

            saveBtn.addEventListener('click', async () => {
                const category = select.value;
                if (!category) {
                    alert('Please select a category');
                    return;
                }

                await this.saveWord({
                    word: this.selectedText,
                    translation,
                    category,
                    date: new Date().toISOString()
                });

                modalContainer.remove();
                if (this.button) {
                    this.button.remove();
                    this.button = null;
                }
            });

        } catch (error) {
            console.error('Modal display error:', error);
            alert('An error occurred while showing translation: ' + error.message);
        }
    }

    async getCategories() {
        try {
            const categories = await browser.runtime.sendMessage({
                type: 'getCategories'
            });
            return categories || ['General'];
        } catch (error) {
            console.error('Error getting categories:', error);
            return ['General'];
        }
    }

    async saveWord(wordData) {
        try {
            await browser.runtime.sendMessage({
                type: 'saveWord',
                wordData: wordData
            });
            return true;
        } catch (error) {
            console.error('Error saving word:', error);
            throw error;
        }
    }
}

window.addEventListener('load', () => {
    new TranslatorButton();
});