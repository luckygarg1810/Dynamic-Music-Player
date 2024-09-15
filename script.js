console.log("Let's write some JavaScript");
let currentsong = new Audio();
let currentFolder;
let songs = [];
let playableSongs = [];
let artists = [];
currentsong.volume = 0.5;
let previousVolume = currentsong.volume; // Store the initial volume


function getRandomItem(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

function convertSecondsToMinutes(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    if (remainingSeconds < 10) {
        remainingSeconds = '0' + remainingSeconds;
    }

    return minutes + ':' + remainingSeconds;
}

async function fetchFolderData(folder) {
    let response = await fetch(`/${folder}/`);
    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;

    let links = div.getElementsByTagName("a");
    return Array.from(links).filter(link => link.href.endsWith("mp3"));
}

async function getSongs(folder) {
    currentFolder = folder;
    let links = await fetchFolderData(folder);

    songs = links.map(link => link.href.split(`${folder}/`)[1].split("-")[0]);
    playableSongs = links.map(link => link.href.split(`${folder}/`)[1]);
}

async function getArtists(folder) {
    let links = await fetchFolderData(folder);

    artists = links.map(link => {
        let parts = link.href.split(`${folder}/`)[1].split("-");
        return parts.length > 1 ? parts[1].replace(".mp3", "") : "Unknown Artist";
    });
}
function cleanTitle(title) {
    // Remove unwanted phrases like "full song", "official", "full video songs", "128 kbps", "320 kbps"
    const unwantedPhrases = [
        "full song", "official","FULL VIDEO SONG", "full video song",
        "128 kbps", "320 kbps"
    ];
    
    unwantedPhrases.forEach(phrase => {
        title = title.replace(new RegExp(phrase, "gi"), "");
    });
    
    // Remove brackets and anything inside them
    title = title.replace(/\[.*?\]|\(.*?\)/g, "");
    
    // Trim any remaining whitespace
    return title.trim();
}

function updateSongList() {
    let songUL = document.querySelector(".currentsong ul");
    let listHTML = "";
    for (let i = 0; i < songs.length; i++) {
        let song = cleanTitle(songs[i].replace("%20", " "));
        let artist = cleanTitle(artists[i] ? artists[i].replace("%20", " ") : "Unknown Artist");

        listHTML += `
        <li data-song="${playableSongs[i]}">
            <img src="Assets/music.svg" alt="">
            <div class="info">
                <div class="songname">${song.replaceAll("%20", " ").replace(".mp3", "")}</div>
                <div class="artist">${artist.replaceAll("%20", " ")}</div>
            </div>
            <img src="Assets/playbutton2.svg" class="playnow">
        </li>`;
    }
    songUL.innerHTML = listHTML;

    Array.from(document.querySelector(".currentsong").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            let songUrl = e.dataset.song; // Get the song URL from the data attribute
            console.log("Song URL:", songUrl);
            playMusic(songUrl);
        });
    });
}

function playMusic(track, pause = false) {
    currentsong.src = `${currentFolder}/${track}`;
    previousVolume = currentsong.volume;
    currentsong.loop =  document.querySelector(".loop img").src.includes("looped.svg");
    if (!pause) {
        currentsong.play();
        const playImage = playbutton.querySelector("img");
        playImage.src = "Assets/pause.svg";
        previousVolume = currentsong.volume;
    }

    let songName, artistName;
    let parts = track.split(" - ");
    if (parts.length > 1) {
        songName = parts[0].replaceAll("%20", " ").replace(".mp3", "").trim();
        artistName = parts[1].replaceAll("%20", " ").replace(".mp3", "").trim();
    } else {
        let altParts = track.split("-");
        songName = altParts[0].replaceAll("%20", " ").replace(".mp3", "").trim();
        artistName = altParts.length > 1 ? altParts[1].replaceAll("%20", " ").replace(".mp3", "").trim() : "Unknown Artist";
    }
    const unwantedWords = ["full song", "FULL VIDEO","official", "full video songs"];
    unwantedWords.forEach(word => {
        const regex = new RegExp(word, "i");
        songName = songName.replace(regex, "").trim();
    });
    playing.src = "Assets/playing.svg";
    document.querySelector(".songName").innerHTML = songName;
    document.querySelector(".artistName").innerHTML = artistName;
    document.querySelector(".duration").innerHTML = "00:00/00:00";

    // Update the play/pause icon for the current song
    updatePlayPauseIcon(track);

    currentsong.onended = () => {
        if(!currentsong.loop){
            let currentIndex = playableSongs.indexOf(track);
            let nextIndex;

            if(currentIndex + 1 < playableSongs.length){
          nextIndex = currentIndex +1;
            }
            else{
                nextIndex = 0;
            }
            playMusic(playableSongs[nextIndex]);
        }
    };
}

function updatePlayPauseIcon(currentTrack) {
    Array.from(document.querySelectorAll(".currentsong li")).forEach(e => {
        let playIcon = e.querySelector(".playnow");
        if (e.dataset.song === currentTrack) {
            playIcon.src = currentsong.paused ? "Assets/playbutton2.svg" : "Assets/pause2.svg";
        } else {
            playIcon.src = "Assets/playbutton2.svg";
        }
    });
}
// Function to handle fast forward
function handleFastForwardClicks() {
    let clickCount = 0;
    let clickTimer;

    forward.addEventListener("click", () => {
        clickCount++;
        clearTimeout(clickTimer);

        clickTimer = setTimeout(() => {
            if (clickCount === 1) {
                currentsong.currentTime = Math.min(currentsong.duration, currentsong.currentTime + 10); 
            } else if (clickCount === 2) {
                currentsong.currentTime = Math.min(currentsong.duration, currentsong.currentTime + 20); 
            } else if (clickCount >= 3) {
                currentsong.currentTime = Math.min(currentsong.duration, currentsong.currentTime + 40); 
            }

            clickCount = 0; // Reset the count after handling
        }, 500); // Time window to detect multiple clicks
    });
}

// Function to handle fast backward
function handleFastBackwardClicks() {
    let clickCount = 0;
    let clickTimer;

    backward.addEventListener("click", () => {
        clickCount++;
        clearTimeout(clickTimer);

        clickTimer = setTimeout(() => {
            if (clickCount === 1) {
                currentsong.currentTime = Math.max(0, currentsong.currentTime - 10); // 
            } else if (clickCount === 2) {
                currentsong.currentTime = Math.max(0, currentsong.currentTime - 20); // 
            } else if (clickCount >= 3) {
                currentsong.currentTime = Math.max(0, currentsong.currentTime - 30); // 
            }

            clickCount = 0; // Reset the count after handling
        }, 500); // Time window to detect multiple clicks
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
        currentsong.currentTime = Math.min(currentsong.duration, currentsong.currentTime + 5); // Forward 5 seconds
    } else if (event.key === "ArrowLeft") {
        currentsong.currentTime = Math.max(0, currentsong.currentTime - 5); // Backward 5 seconds
    }
});

function setupEventListeners() {

    // Call these functions to set up event listeners

    let isDragging = false; 
    playbutton.addEventListener("click", () => {
        const playImage = playbutton.querySelector("img");
        if (currentsong.paused) {
            playImage.src = "Assets/pause.svg";
            currentsong.play();
            previousVolume = currentsong.volume;
        } else {
            playImage.src = "Assets/playbutton.svg";
            currentsong.pause();
        }
        updatePlayPauseIcon(currentsong.src.split(`${currentFolder}/`)[1]);
    });

    document.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            const playImage = playbutton.querySelector("img");
            if (currentsong.paused) {
                playImage.src = "Assets/pause.svg";
                currentsong.play();
                previousVolume = currentsong.volume;
            } else {
                playImage.src = "Assets/playbutton.svg";
                currentsong.pause();
            }
            updatePlayPauseIcon(currentsong.src.split(`${currentFolder}/`)[1]);
        }
    });

    currentsong.addEventListener("timeupdate", () => {
        if(!isDragging){
        document.querySelector(".duration").innerHTML = `${convertSecondsToMinutes(Math.floor(currentsong.currentTime))} / ${convertSecondsToMinutes(Math.floor(currentsong.duration))}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
        }
  });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = e.offsetX / e.target.getBoundingClientRect().width * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = currentsong.duration * percent / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left1").style.left = "0%";
        document.querySelector(".left2").style.left = "0%";
    });

    previousbutton.addEventListener("click", () => {
        let index = playableSongs.indexOf((currentsong.src.split(`${currentFolder}/`)[1]));
        if (index > 0) {
            playMusic(playableSongs[index - 1]);
        }
    });

    nextbutton.addEventListener("click", () => {
        let index = playableSongs.indexOf((currentsong.src.split(`${currentFolder}/`)[1]));
        if (index + 1 < playableSongs.length) {
            playMusic(playableSongs[index + 1]);
        }
    });

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", e => {
        const volumeValue = parseInt(e.target.value) / 100;
        currentsong.volume = volumeValue;
        
        if (volumeValue > 0 && document.getElementById("volumemute").src.includes("Assets/muted.svg")) {
            document.getElementById("volumemute").src = "Assets/volumehigh.svg";
        }
        else if(volumeValue == 0 && document.getElementById("volumemute").src.includes("Assets/volumehigh.svg")) {
            document.getElementById("volumemute").src = "Assets/muted.svg";
        }
        
        previousVolume = volumeValue;

    });

    document.querySelector(".loop img").addEventListener("click", e => {
        const loopIcon = document.querySelector(".loop img");
        console.log(e);
        
        
        if (currentsong.loop) {
            currentsong.loop = false;
            loopIcon.src = "Assets/loop.svg"; // Change back to original loop icon
        } else {
            currentsong.loop = true;
            loopIcon.src = "Assets/looped.svg"; // Change to looped icon
        }
    });
    
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");

    circle.addEventListener("mousedown", e =>{
        console.log('i am mousedown');
        
     isDragging = true;
     e.preventDefault();
    })

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            const seekbarRect = seekbar.getBoundingClientRect();
            let percent = (e.clientX - seekbarRect.left) / seekbarRect.width * 100;

            // Constrain the percent between 0 and 100
            percent = Math.max(0, Math.min(percent, 100));
            circle.style.left = percent + "%";
        }
    });

    // Mouse up event to end dragging
    document.addEventListener("mouseup", (e) => {
        if (isDragging) {
            isDragging = false;

            const seekbarRect = seekbar.getBoundingClientRect();
            let percent = (e.clientX - seekbarRect.left) / seekbarRect.width * 100;
            
            // Constrain the percent between 0 and 100
            percent = Math.max(0, Math.min(percent, 100));
            circle.style.left = percent + "%";

            // Update the current time of the song based on the dragged position
            currentsong.currentTime = currentsong.duration * (percent / 100);
        }
    });
    handleFastForwardClicks();
    handleFastBackwardClicks();
    handleArrowKeyPresses(); 
}

async function displayAlbums() {
    let response = await fetch(`/Songs/`);
    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let anchors = div.getElementsByTagName("a")
    let cardcontainer = document.querySelector(".cardcontainer")
    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/Songs")) {
            let folder = e.href.split("/").slice(-2)[0];
            console.log(folder);

       
            let response = await fetch(`/Songs/${folder}/info.json`);
            let text = await response.json();
            console.log(text);

            cardcontainer.innerHTML = cardcontainer.innerHTML + `  <div data-folder="${folder}" class="card">
            <div class = "cardDiv">
            <img class="card1img" src="/Songs/${folder}/cover.jpg" alt="" sizes=""
              srcset="">
            <button class="playiconbutton"><img src="Assets/playicon.svg" class="playicon"> </button>
            <h4>${text.title}</h4>
            <p>${text.description}</p>
            </div>
          </div>`
        }

    }
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            let folder = `Songs/${item.currentTarget.dataset.folder}`;
            await getSongs(folder);
            await getArtists(folder);
            updateSongList();
        });
    });

    Array.from(document.getElementsByClassName("playiconbutton")).forEach(button => {
        button.addEventListener("click", async (event) => {
            event.stopPropagation(); 
            let folder = `Songs/${button.closest('.card').dataset.folder}`;
            await getSongs(folder);
            await getArtists(folder);
            updateSongList();
            playMusic(getRandomItem(playableSongs)); 
        });
    });
   
    document.getElementById("volumemute").addEventListener("click", e =>{
        console.log(e.target);
        
        if (e.target.src.includes("Assets/volumehigh.svg")) {
            previousVolume = currentsong.volume ;
            e.target.src = "Assets/muted.svg"; // Change to muted icon
            currentsong.volume = 0; // Mute the audio
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            console.log("hello"); // This will now execute when src is "Assets/muted.svg"
            e.target.src = "Assets/volumehigh.svg"; // Change back to volume icon
            currentsong.volume = previousVolume; // Set the volume back to 0.4
            document.querySelector(".range").getElementsByTagName("input")[0].value = previousVolume*100;
        }
    })
}

async function main() {
    await getSongs("Songs/Iconic%20Punjabi%20Hits");
    await getArtists("Songs/Iconic%20Punjabi%20Hits");
    updateSongList();
    playMusic(getRandomItem(playableSongs), true);
    displayAlbums();
    setupEventListeners();
    document.querySelector(".range input").value = currentsong.volume * 100
}

main();
