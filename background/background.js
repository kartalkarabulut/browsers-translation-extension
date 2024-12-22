// Content script'lerden gelen mesajları dinle
browser.runtime.onMessage.addListener(async (message) => {
    switch (message.type) {
        case 'getCategories':
            const categoriesResult = await browser.storage.sync.get(['categories']);
            return categoriesResult.categories || ['General'];

        case 'saveWord':
            const wordsResult = await browser.storage.sync.get(['words']);
            const words = wordsResult.words || [];
            words.push(message.wordData);
            await browser.storage.sync.set({ words });
            return true;
    }
});

// İlk yüklemede varsayılan dili ayarla
browser.runtime.onInstalled.addListener(async () => {
    const result = await browser.storage.sync.get(['targetLanguage']);
    if (!result.targetLanguage) {
        await browser.storage.sync.set({ targetLanguage: 'TR' });
    }
});
