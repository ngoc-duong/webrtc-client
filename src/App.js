import React, { useEffect, useRef } from 'react';
import { Client, LocalStream } from 'ion-sdk-js';
import { IonSFUJSONRPCSignal } from 'ion-sdk-js/lib/signal/json-rpc-impl';
import "./App.css";

const App = () => {
  const pubVideo = useRef();
  const subVideo = useRef();

  let isPub, client, signal;

  const config = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };
  // http://localhost:8000/?publish=true
  const URL = new URLSearchParams(window.location.search).get("publish");
  const sid = new URLSearchParams(window.location.search).get("ssid");
  console.log("url", URL);
  console.log("sid", sid);
  if (URL) {
    isPub = true;
  } else {
    isPub = false;
  }

  useEffect(() => {
    signal = new IonSFUJSONRPCSignal("ws://10.3.81.154:7000/ws");
    // signal = new IonSFUJSONRPCSignal("ws://localhost:7000/pull");
    client = new Client(signal, config);
    signal.onopen = () => {
      console.log("client join")
      client.join(sid)
    };

    if (!isPub) {
      client.ontrack = (track, stream) => {
        console.log("got track: ", track.id, "for stream: ", stream.id);
        track.onunmute = () => {
          subVideo.current.srcObject = stream;
          subVideo.current.autoplay = true;
          subVideo.current.muted = false;

          stream.onremovetrack = () => {
            subVideo.current.srcObject = null;
          }
        }
      }
    }
  }, []);

  const start = (event) => {
    if (event) {
      LocalStream.getUserMedia({
        resolution: 'vga',
        audio: true,
        codec: "vp8"
      }).then((media) => {
        pubVideo.current.srcObject = media;
        pubVideo.current.autoplay = true;
        pubVideo.current.controls = true;
        pubVideo.current.muted = true;
        console.log("publish media")
        client.publish(media);
      }).catch(console.error);
    } else {
      LocalStream.getDisplayMedia({
        resolution: 'vga',
        video: true,
        audio: true,
        codec: "vp8"
      }).then((media) => {
        pubVideo.current.srcObject = media;
        pubVideo.current.autoplay = true;
        pubVideo.current.controls = true;
        pubVideo.current.muted = true;
        client.publish(media);
      }).catch(console.error);
    }
  }

  return (
    <div className="flex-col h-screen relative backgroud-media">
      <header className="flex h-16 justify-center items-center text-xl bg-black text-white">
        <div className='title-text'>ion-sfu</div>
        {isPub ? (
          <div className="absolute top-2 right-5">
            <button id="bnt_pubcam" className="bg-blue-500 px-4 py-2 text-white rounded-lg mr-5" onClick={() => start(true)}>Publish Camera</button>
            <button id="bnt_pubscreen" className="bg-green-500 px-4 py-2 text-white rounded-lg" onClick={() => start(false)}>Publish Screen</button>
          </div>
        ) : null
        }
      </header>
      {isPub ? (
        <video id="pubVideo" className="bg-black video-media" controls ref={pubVideo}></video>
      ) : (
        <video id="subVideo" className="bg-black video-media" controls ref={subVideo}></video>
      )}
    </div>
  );
}

export default App;
