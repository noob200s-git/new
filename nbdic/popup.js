document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const wordInput = document.getElementById("wordInput");
  const definitionDiv = document.getElementById("definition");

  const cache = {};

  wordInput.focus();

  function showLoading() {
      definitionDiv.innerHTML = `
          <div class="loading">
              <div class="loading-spinner"></div>
          </div>
      `;
  }

  function showMessage(message, isError = false) {
      definitionDiv.innerHTML = `
          <div class="message ${isError ? 'error' : ''}">
              ${message}
          </div>
      `;
  }

  async function searchWord() {
      let word = wordInput.value.trim().toLowerCase();
      if (!word) {
          showMessage("Please enter a word!");
          return;
      }

      
      if (cache[word]) {
          displayWordData(word, cache[word]);
          return;
      }

      showLoading();
      let url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

      try {
          let response = await fetch(url);
          let data = await response.json();

          if (response.status !== 200 || data.title) {
              showMessage("Word not found! Please check spelling.", true);
              return;
          }

          cache[word] = data; 
          displayWordData(word, data);
      } catch (error) {
          showMessage("Error fetching data! Check your connection.", true);
          console.error("Fetch error:", error);
      }
  }

  function displayWordData(word, data) {
      const formattedWord = word.charAt(0).toUpperCase() + word.slice(1);
      let phonetic = data[0].phonetics?.find(p => p.text)?.text || "";
      let audioUrl = data[0].phonetics?.find(p => p.audio)?.audio || "";

      let html = `<div class="definition-word">${formattedWord}</div>`;

      if (phonetic || audioUrl) {
          html += `<div class="phonetics">`;
          if (phonetic) html += `<span class="pronunciation">${phonetic}</span>`;
          if (audioUrl) {
              html += `<button class="audio-btn" data-audio="${audioUrl}">
                          🔊 Play Pronunciation
                       </button>`;
          }
          html += `</div>`;
      }

      html += `<div class="tabs">
                  <div class="tab active" data-tab="definitions">Definitions</div>
                  <div class="tab" data-tab="synonyms">Synonyms</div>
                  <div class="tab" data-tab="antonyms">Antonyms</div>
               </div>`;


      html += `<div class="tab-content active" id="definitions-tab">`;
      let allDefinitions = [];
      data[0].meanings.forEach(meaning => {
          meaning.definitions.forEach(def => {
              allDefinitions.push({
                  definition: def.definition,
                  example: def.example || "",
                  partOfSpeech: meaning.partOfSpeech
              });
          });
      });

      if (allDefinitions.length > 0) {
          allDefinitions.forEach((def, index) => {
              html += `<div class="definition-item">
                          <div class="definition-text">
                              ${index + 1}. ${def.definition}
                              <span class="pos-tag">${def.partOfSpeech}</span>
                          </div>
                          ${def.example ? `<div class="example">"${def.example}"</div>` : ""}
                       </div>`;
          });
      } else {
          html += `<div class="message">No definitions found</div>`;
      }
      html += `</div>`;


      let allSynonyms = [...new Set(data[0].meanings.flatMap(m => m.synonyms))];
      html += `<div class="tab-content" id="synonyms-tab">`;
      if (allSynonyms.length > 0) {
          allSynonyms.slice(0, 15).forEach(synonym => {
              html += `<span class="synonym" data-word="${synonym}">${synonym}</span>`;
          });
      } else {
          html += `<div class="message">No synonyms found</div>`;
      }
      html += `</div>`;


      let allAntonyms = [...new Set(data[0].meanings.flatMap(m => m.antonyms))];
      html += `<div class="tab-content" id="antonyms-tab">`;
      if (allAntonyms.length > 0) {
          allAntonyms.slice(0, 15).forEach(antonym => {
              html += `<span class="antonym" data-word="${antonym}">${antonym}</span>`;
          });
      } else {
          html += `<div class="message">No antonyms found</div>`;
      }
      html += `</div>`;

      definitionDiv.innerHTML = html;


      document.querySelectorAll(".tab").forEach(tab => {
          tab.addEventListener("click", () => {
              document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
              document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

              tab.classList.add("active");
              document.getElementById(`${tab.dataset.tab}-tab`).classList.add("active");
          });
      });


      const audioBtn = document.querySelector(".audio-btn");
      if (audioBtn) {
          audioBtn.addEventListener("click", () => {
              new Audio(audioBtn.dataset.audio).play();
          });
      }


      document.querySelectorAll(".synonym, .antonym").forEach(wordEl => {
          wordEl.addEventListener("click", () => {
              wordInput.value = wordEl.dataset.word;
              searchWord();
          });
      });
  }
  


  searchBtn.addEventListener("click", searchWord);
  wordInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
          searchWord();
      }
  });


  async function preloadCommonWords() {
      const commonWords = ["hello", "world", "example", "dictionary"];
      for (const word of commonWords) {
          try {
              let response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
              let data = await response.json();
              if (response.status === 200 && !data.title) {
                  cache[word] = data;
              }
          } catch (error) {
              console.error("Preload error:", error);
          }
      }
  }
  
  preloadCommonWords();
});
