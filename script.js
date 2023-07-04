// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCobGwKjprqbRZiGUOUwcF_0srE2R0awBI",
    authDomain: "tic-tac-toe-496f4.firebaseapp.com",
    databaseURL: "https://tic-tac-toe-496f4-default-rtdb.firebaseio.com",
    projectId: "tic-tac-toe-496f4",
    storageBucket: "tic-tac-toe-496f4.appspot.com",
    messagingSenderId: "191237097238",
    appId: "1:191237097238:web:3c456c55502e8420e2f237"
  };
  
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const lobbyRef = database.ref('lobbies');
  
  // Declare and initialize gameState variable
  let gameState = {
    currentPlayer: 0,
    board: [['', '', ''], ['', '', ''], ['', '', '']],
    players: {
      0: "",
      1: ""
    },
    gameStarted: false
  };

  let currentPlayerName; // Variable to store the current player's name
  let gameStartNotified = false; // Variable to track if the game start message has been displayed
  
  // Function to generate a random lobby ID
  function generateLobbyID() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 6; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
  }

  let lobbyID;
  
// Function to create a new lobby
function createLobby(playerName) {
  const lobbyID = generateLobbyID();
  const lobbyData = {
    players: {
      0: playerName,
      1: ""
    },
    gameStarted: false,
    currentPlayer: 0,
    board: [['', '', ''], ['', '', ''], ['', '', '']]
  };

  lobbyRef.child(lobbyID).set(lobbyData);

  return lobbyID; // Return the generated lobby ID
}
  
// Function to join a lobby
function joinLobby(lobbyID, playerName) {
  currentPlayerName = playerName; // Store the current player's name

  lobbyRef.child(lobbyID).transaction(function (lobby) {
    if (lobby) {
      if (!lobby.players) {
        lobby.players = {
          0: "",
          1: ""
        };
      }
      if (lobby.players[0] === "") {
        lobby.players[0] = playerName; // Assign the playerName to player 0 if it's empty
      } else if (lobby.players[1] === "") {
        lobby.players[1] = playerName; // Assign the playerName to player 1 if it's empty
      }

      if (lobby.players[0] !== "" && lobby.players[1] !== "") {
        lobby.gameStarted = true; // Start the game when both players have joined
      }
    }
    return lobby;
  });
}
  
  // Function to start the game in a lobby
  function startGame(lobbyID) {
    lobbyRef.child(lobbyID).update({
      gameStarted: true
    });
  }
  
// Function to listen for changes in a lobby
function listenForChanges(lobbyID) {
  const lobbyDataRef = lobbyRef.child(lobbyID);

  lobbyDataRef.on("value", snapshot => {
    const lobbyData = snapshot.val();
    if (lobbyData) {
      gameState.board = lobbyData.board;
      gameState.currentPlayer = lobbyData.currentPlayer;
      gameState.players = lobbyData.players;
      gameState.gameStarted = lobbyData.gameStarted;

      updateBoardUI(); // Update the UI with the latest board data

      // Check if the game is over
      const winner = checkForWin();
      if (winner !== null) {
        showGameOverScreen(winner);
      } else if (gameState.board.every(row => row.every(cell => cell !== ""))) {
        showGameOverScreen(null); // Call showGameOverScreen with null winner for a tie
      }

      // Check if the second player has joined and the game has started, and the game start message hasn't been displayed
      if (!gameStartNotified && lobbyData.players[1] !== "" && lobbyData.gameStarted) {
        const messageElement = document.getElementById('message');
        messageElement.classList.remove('hidden');

        setTimeout(function() {
          messageElement.classList.add('hidden');
        }, 2000);

        gameStartNotified = true; // Set the gameStartNotified variable to true to prevent multiple notifications
      }
    }
  });
}
  
  // Function to update the UI with the latest board data
  function updateBoardUI() {
    const cells = document.querySelectorAll(".main > div");
    cells.forEach((cell, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      cell.textContent = gameState.board[row][col];
    });
  }
  
  // Function to show lobby creation UI
  function showLobbyCreation() {
    document.getElementById("lobby-creation").style.display = "flex";
    document.getElementById("lobby-joining").style.display = "none";
  }
  
  // Function to show lobby joining UI
  function showLobbyJoining() {
    document.getElementById("lobby-creation").style.display = "none";
    document.getElementById("lobby-joining").style.display = "flex";
  }
  
  // Function to get the current player's marker ('X' or 'O')
  function currentPlayerMarker() {
    return gameState.currentPlayer === 0 ? "X" : "O";
  }
  
  function handlePlayerMove(event, lobbyID) {
    const clickedCell = event.target;
    const cellIndex = parseInt(clickedCell.dataset.index);
    const row = Math.floor(cellIndex / 3);
    const col = cellIndex % 3;
  
    if (Array.isArray(gameState.board[row]) && gameState.board[row][col] === "") {
      gameState.board[row][col] = currentPlayerMarker();
  
      // Update the game state
      gameState.currentPlayer = 1 - gameState.currentPlayer;
  
      const lobbyRef = database.ref("lobbies/" + lobbyID);
      lobbyRef.update({
        board: gameState.board,
        currentPlayer: gameState.currentPlayer
      });
  
      updateBoardUI(); // Update the UI with the latest board data
    }
  }

  function checkForWin() {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (
        gameState.board[i][0] !== "" &&
        gameState.board[i][0] === gameState.board[i][1] &&
        gameState.board[i][1] === gameState.board[i][2]
      ) {
        return gameState.board[i][0] === "X" ? 0 : 1;
      }
    }
  
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (
        gameState.board[0][i] !== "" &&
        gameState.board[0][i] === gameState.board[1][i] &&
        gameState.board[1][i] === gameState.board[2][i]
      ) {
        return gameState.board[0][i] === "X" ? 0 : 1;
      }
    }
  
    // Check diagonals
    if (
      gameState.board[0][0] !== "" &&
      gameState.board[0][0] === gameState.board[1][1] &&
      gameState.board[1][1] === gameState.board[2][2]
    ) {
      return gameState.board[0][0] === "X" ? 0 : 1;
    }
    if (
      gameState.board[0][2] !== "" &&
      gameState.board[0][2] === gameState.board[1][1] &&
      gameState.board[1][1] === gameState.board[2][0]
    ) {
      return gameState.board[0][2] === "X" ? 0 : 1;
    }
  
    // No winner yet
    return null;
  }

function checkGameOver() {
  const winnerIndex = checkForWin();

  if (winnerIndex !== null) {
    const winner = gameState.players[winnerIndex];
    showGameOverScreen(winner);
    return;
  }

  if (gameState.board.every(row => row.every(cell => cell !== ""))) {
    showGameOverScreen(null); // Call showGameOverScreen with null winner for a tie
  }
}
  
  // Event listener for the create lobby button
  document.getElementById("create-lobby-button").addEventListener("click", function () {
    showLobbyCreation();
  });
  
// Event listener for the create lobby button
document.getElementById("submit-create-lobby-button").addEventListener("click", function () {
  const playerName = document.getElementById("create-player-name-input").value;
  const lobbyID = createLobby(playerName);
  const lobbyCode = "Lobby Code: " + lobbyID;
  currentPlayerName = playerName; // Store the current player's name
  attachCellEventListeners(lobbyID); // Pass the lobbyID to the function

  // Hide the create lobby form
  document.getElementById("lobby-creation").style.display = "none";

  // Display the lobby code
  document.getElementById("lobby-code").style.display = "block";
  document.getElementById("lobby-code-text").textContent = lobbyCode;
});
  
  // Event listener for the join lobby button
  document.getElementById("join-lobby-button").addEventListener("click", function () {
    showLobbyJoining();
  });
  
// Event listener for the join lobby button
document.getElementById("submit-join-lobby-button").addEventListener("click", function () {
  const playerName = document.getElementById("join-player-name-input").value;
  const enteredLobbyID = document.getElementById("join-lobby-id-input").value;
  joinLobby(enteredLobbyID, playerName);
  lobbyID = enteredLobbyID; // Assign the lobbyID value
  currentPlayerName = playerName; // Store the current player's name
  attachCellEventListeners(lobbyID); // Pass the lobbyID to the function

  // Hide the lobby joining form
  document.getElementById("lobby-joining").style.display = "none";

  // Display the lobby code
  document.getElementById("lobby-code").style.display = "block";
  document.getElementById("lobby-code-text").textContent = "Lobby Code: " + enteredLobbyID;
});



// Function to add event listeners to the div children of the main div
function attachCellEventListeners(lobbyID) {
  const cells = document.querySelectorAll(".main > div");
  cells.forEach((cell, index) => {
    cell.addEventListener("click", function (event) {
      if (gameState.currentPlayer === 0 && gameState.players[0] === currentPlayerName) {
        // Only allow the player with the correct name and currentPlayer value 0 to make a move
        console.log("Cell clicked");
        handlePlayerMove(event, lobbyID);
      } else if (gameState.currentPlayer === 1 && gameState.players[1] === currentPlayerName) {
        // Only allow the player with the correct name and currentPlayer value 1 to make a move
        console.log("Cell clicked");
        handlePlayerMove(event, lobbyID);
      } else {
        // Display a message indicating it's not the current player's turn
        console.log("Not your turn");
      }
    });
  });
  console.log("Event listeners attached");

  // Start listening for changes in the lobby
  listenForChanges(lobbyID);
}

function showGameOverScreen(winnerIndex) {
  // Update the UI with the latest board data
  updateBoardUI();

  // Remove event listeners from all cells
  const cells = document.querySelectorAll(".main > div");
  cells.forEach(cell => {
    const clonedCell = cell.cloneNode(true);
    cell.parentNode.replaceChild(clonedCell, cell);
  });

  // Create a div element for the game over screen
  const gameOverScreen = document.createElement("div");
  gameOverScreen.classList.add("game-over-screen");

  // Create a message element to display the winner
  const message = document.createElement("p");
  if (winnerIndex !== null) {
    const winner = gameState.players[winnerIndex];
    message.textContent = winner + " wins!";
  } else {
    message.textContent = "It's a tie!";
  }
  gameOverScreen.appendChild(message);

  // Create a play again button
  const playAgainButton = document.createElement("button");
  playAgainButton.textContent = "Play Again";
  playAgainButton.addEventListener("click", function () {
    // Reload the page to start a new game
    location.reload();
  });
  gameOverScreen.appendChild(playAgainButton);

  // Append the game over screen to the body
  document.body.appendChild(gameOverScreen);
  
  // Attach event listeners to the cells again
  attachCellEventListeners();
}
