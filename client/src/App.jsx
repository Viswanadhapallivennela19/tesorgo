import React, { useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

function App() {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const handleJoin = async () => {
  if (!roomId) return;
  setStatus(`Joined room: ${roomId}`);
  setJoined(true);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;
  } catch (error) {
    console.error("Error accessing media devices:", error);
    setStatus("⚠️ Camera or Mic not available. Join as viewer only.");
  }

  socket.emit('join', roomId);
};


  useEffect(() => {
    socket.on('user-joined', async (userId) => {
      const pc = new RTCPeerConnection(config);
      peerConnectionRef.current = pc;

      localStreamRef.current.getTracks().forEach(track =>
        pc.addTrack(track, localStreamRef.current)
      );

      pc.onicecandidate = e => {
        if (e.candidate) {
          socket.emit('signal', {
            to: userId,
            data: { candidate: e.candidate },
          });
        }
      };

      pc.ontrack = e => {
        remoteVideoRef.current.srcObject = e.streams[0];
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('signal', {
        to: userId,
        data: { offer },
      });
    });

    socket.on('signal', async ({ from, data }) => {
      let pc = peerConnectionRef.current;

      if (!pc) {
        pc = new RTCPeerConnection(config);
        peerConnectionRef.current = pc;

        localStreamRef.current.getTracks().forEach(track =>
          pc.addTrack(track, localStreamRef.current)
        );

        pc.onicecandidate = e => {
          if (e.candidate) {
            socket.emit('signal', {
              to: from,
              data: { candidate: e.candidate },
            });
          }
        };

        pc.ontrack = e => {
          remoteVideoRef.current.srcObject = e.streams[0];
        };
      }

      if (data.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', {
          to: from,
          data: { answer },
        });
      }

      if (data.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }

      if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on('user-left', () => {
      setStatus('User left the room');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      remoteVideoRef.current.srcObject = null;
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="container">
      <h1>TensorGo WebRTC Video Chat</h1>

      {!joined ? (
        <div>
          <input
            placeholder="Enter Room ID"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
          />
          <button onClick={handleJoin}>Join Room</button>
        </div>
      ) : (
        <div>
          <p>{status}</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <video ref={localVideoRef} autoPlay muted />
            <video ref={remoteVideoRef} autoPlay />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
