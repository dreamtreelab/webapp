import { getServerConfig, getRTCConfiguration } from "../../js/config.js";
import { VideoPlayer } from "../../js/videoplayer.js";
import { RenderStreaming } from "../../module/renderstreaming.js";
import { Signaling, WebSocketSignaling } from "../../module/signaling.js";

let playButton;
let renderstreaming;
let useWebSocket;

const playerDiv = document.getElementById('player');
const videoPlayer = new VideoPlayer();

setup();

window.addEventListener('beforeunload', async () => {
  if (renderstreaming) {
    await renderstreaming.stop();
  }
});

async function setup() {
  const res = await getServerConfig();
  useWebSocket = res.useWebSocket;
  showPlayButton();
}

function showPlayButton() {
  if (!document.getElementById('playButton')) {
    const elementPlayButton = document.createElement('button');
    elementPlayButton.id = 'playButton';
    elementPlayButton.innerText = 'Play Stream';
    playButton = playerDiv.appendChild(elementPlayButton);
    playButton.addEventListener('click', onClickPlayButton);
  }
}

function onClickPlayButton() {
  playButton.style.display = 'none';

  // add video player
  videoPlayer.createPlayer(playerDiv);
  setupRenderStreaming();
}

async function setupRenderStreaming() {
  const signaling = useWebSocket ? new WebSocketSignaling() : new Signaling();
  const config = getRTCConfiguration();
  renderstreaming = new RenderStreaming(signaling, config);

  renderstreaming.onTrackEvent = (data) => videoPlayer.addTrack(data.track);

  renderstreaming.onConnect = () => {
    const channel = renderstreaming.createDataChannel("input");
    videoPlayer.setupInput(channel);
  };

  renderstreaming.onDisconnect = async () => {
    await renderstreaming.stop();
    renderstreaming = null;
    videoPlayer.deletePlayer();
    showPlayButton();
  };

  await renderstreaming.start();
  await renderstreaming.createConnection();
}
