async function saveScore() {
    let username = userData.username;
    console.log(username);
    try {
        const response = await fetch('/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                elapsedTime: elapsedTime,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Score saved:', data);
        } else {
            console.error('Error saving score:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

const navbar = document.getElementById("navbar");
const footbar = document.getElementById("footbar");

const lbContainer = document.getElementById("lbContainer");
async function getScores() {
    board.style.opacity = 0;
    navbar.style.opacity = 0;
    footbar.style.opacity = 0;
    playAgain.style.opacity = 0;
    lbContainer.style.display = "block";

    try {
        const response = await fetch("/leaderboard");
        const templateHTML = await response.text();
        lbContainer.innerHTML = templateHTML;
    } catch (error) {
        console.error("Error:", error);
    }
}

function hideScores() {
    board.style.opacity = 1;
    navbar.style = "";
    footbar.style = "";
    playAgain.style = "";
    lbContainer.style.display = "none";
}

