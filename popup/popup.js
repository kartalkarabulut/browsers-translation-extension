class PopupManager {
  constructor() {
    this.viewMode = 'cards';
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.words = [];
    this.filteredWords = [];
    this.init();
  }

  async init() {
    await this.setupLanguageSelect();
    this.loadCategories();
    this.loadWords();
    this.setupEventListeners();
    this.setupViewToggle();
  }

  setupEventListeners() {
    document.getElementById('add-category-btn').addEventListener('click', () => {
      document.getElementById('add-category-modal').classList.remove('hidden');
    });

    document.getElementById('cancel-category').addEventListener('click', () => {
      document.getElementById('add-category-modal').classList.add('hidden');
    });

    document.getElementById('save-category').addEventListener('click', () => {
      this.saveNewCategory();
    });

    document.getElementById('category-filter').addEventListener('change', async () => {
      await this.loadWords();
      const searchTerm = document.getElementById('search-input').value;
      const sortType = document.getElementById('sort-by').value;
      
      if (searchTerm) {
        this.filterWords(searchTerm);
      }
      if (sortType) {
        this.sortWords(sortType);
      }
    });

    document.querySelector('.view-toggle').addEventListener('click', (e) => {
      const button = e.target.closest('.view-btn');
      if (!button) return;

      document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      this.viewMode = button.dataset.view;
      this.updateWordsDisplay();
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        console.log('Search input:', e.target.value);
        const searchTerm = e.target.value.toLowerCase();
        this.filterWords(searchTerm);
      });
    }

    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        console.log('Sort changed:', e.target.value);
        this.sortWords(e.target.value);
      });
    }
  }

  async loadCategories() {
    const categories = await this.getCategories();
    const select = document.getElementById('category-filter');
    
    select.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });
  }

  async loadWords() {
    this.words = await this.getWords();
    const selectedCategory = document.getElementById('category-filter').value;
    
    this.filteredWords = selectedCategory 
      ? this.words.filter(word => word.category === selectedCategory)
      : [...this.words];

    console.log('Loaded words:', this.filteredWords);
    this.updateWordsDisplay();
  }

  updateWordsDisplay() {
    const wordsList = document.getElementById('words-list');
    wordsList.innerHTML = '';

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const wordsToShow = this.filteredWords.slice(startIndex, endIndex);

    wordsToShow.forEach(word => {
      const wordElement = this.createWordListItem(word);
      wordsList.appendChild(wordElement);
    });

    this.updatePagination();
  }

  createWordCard(word) {
    const div = document.createElement('div');
    div.className = 'word-card';
    div.innerHTML = `
      <div class="word-header">
        <strong>${word.word}</strong>
        <div class="word-actions">
          <button class="speak-button" data-word="${word.word}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          </button>
          <button class="delete-button" data-word="${word.word}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="translation">${word.translation}</div>
      <small>Category: ${word.category}</small>
      <br>
      <small>Date: ${new Date(word.date).toLocaleDateString('en-US')}</small>
    `;

    this.addWordEventListeners(div, word);
    return div;
  }

  createWordListItem(word) {
    const div = document.createElement('div');
    div.className = 'word-item';
    div.innerHTML = `
      <div class="word-header">
        <strong>${word.word}</strong>
        <div class="word-actions">
          <button class="speak-button" data-word="${word.word}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          </button>
          <button class="delete-button" data-word="${word.word}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="translation">${word.translation}</div>
      <small>Category: ${word.category}</small>
      <br>
      <small>Date: ${new Date(word.date).toLocaleDateString('en-US')}</small>
    `;

    this.addWordEventListeners(div, word);
    return div;
  }

  addWordEventListeners(element, word) {
    const speakButton = element.querySelector('.speak-button');
    const deleteButton = element.querySelector('.delete-button');

    speakButton.addEventListener('click', () => this.speakWord(word.word));
    deleteButton.addEventListener('click', () => this.deleteWord(word.word));
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredWords.length / this.itemsPerPage);
    
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages || 1;
    }

    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    pagination.innerHTML = `
      <button class="page-btn prev" ${this.currentPage === 1 ? 'disabled' : ''}>
        Previous
      </button>
      <span>${this.currentPage} / ${totalPages}</span>
      <button class="page-btn next" ${this.currentPage === totalPages ? 'disabled' : ''}>
        Next
      </button>
    `;

    const prevBtn = pagination.querySelector('.prev');
    const nextBtn = pagination.querySelector('.next');

    prevBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updateWordsDisplay();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.updateWordsDisplay();
      }
    });

    const existingPagination = document.querySelector('.pagination');
    if (existingPagination) {
      existingPagination.remove();
    }
    document.getElementById('words-list').after(pagination);
  }

  async saveNewCategory() {
    const input = document.getElementById('new-category-input');
    const category = input.value.trim();

    if (!category) {
      alert('Category name cannot be empty');
      return;
    }

    const categories = await this.getCategories();
    if (categories.includes(category)) {
      alert('This category already exists');
      return;
    }

    categories.push(category);
    await browser.storage.sync.set({ categories });

    input.value = '';
    document.getElementById('add-category-modal').classList.add('hidden');
    this.loadCategories();
  }

  async getCategories() {
    const result = await browser.storage.sync.get(['categories']);
    return result.categories || ['General'];
  }

  async getWords() {
    const result = await browser.storage.sync.get(['words']);
    return result.words || [];
  }

  speakWord(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  }

  async deleteWord(wordToDelete) {
    try {
      if (confirm('Are you sure you want to delete this word?')) {
        const result = await browser.storage.sync.get(['words']);
        const words = result.words || [];
        const updatedWords = words.filter(word => word.word !== wordToDelete);
        
        await browser.storage.sync.set({ words: updatedWords });
        await this.loadWords();
      }
    } catch (error) {
      console.error('Error deleting word:', error);
      alert('An error occurred while deleting the word');
    }
  }

  setupViewToggle() {
    const header = document.querySelector('.header');
    const viewToggle = document.createElement('div');
    viewToggle.className = 'view-toggle';
    viewToggle.innerHTML = `
      <button class="view-btn active" data-view="cards">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zm-11 0h7v7H3z"/>
        </svg>
      </button>
      <button class="view-btn" data-view="list">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M3 13h18v-2H3zm0-7h18V4H3zm0 14h18v-2H3z"/>
        </svg>
      </button>
    `;
    header.appendChild(viewToggle);
  }

  filterWords(searchTerm) {
    if (!searchTerm) {
      this.filteredWords = [...this.words];
    } else {
      this.filteredWords = this.words.filter(word => 
        word.word.toLowerCase().includes(searchTerm) || 
        word.translation.toLowerCase().includes(searchTerm)
      );
    }
    
    const currentSort = document.getElementById('sort-by').value;
    if (currentSort) {
      this.sortWords(currentSort);
    } else {
      this.updateWordsDisplay();
    }
  }

  sortWords(sortType) {
    const words = [...this.filteredWords];
    
    switch(sortType) {
      case 'date-new':
        words.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'date-old':
        words.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'alpha':
        words.sort((a, b) => a.word.localeCompare(b.word));
        break;
    }

    this.filteredWords = words;
    this.updateWordsDisplay();
  }

  async setupLanguageSelect() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      // Depolanmış dili al ve dropdown'da seç
      const result = await browser.storage.sync.get(['targetLanguage']);
      const savedLanguage = result.targetLanguage || 'TR';
      languageSelect.value = savedLanguage;

      // Dil değiştiğinde storage'a kaydet
      languageSelect.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        await browser.storage.sync.set({ targetLanguage: newLang });
      });
    }
  }
}

const popupManager = new PopupManager();
