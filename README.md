# tesorgo
A real-time two-way video calling web application built with React, WebRTC, and Socket.IO, similar to WhatsApp video calls.

Features
-----------
  Two-way video calling
  Room-based connections
  Real-time WebRTC signaling using Socket.IO
  Peer-to-peer media streaming (video/audio)
  Secure local media access

Tech Stack
----------
Frontend: React
Backend: Node.js + Express + Socket.IO
WebRTC for media and peer connection

How It Works
---------------
WebRTC enables direct video and audio communication between two users.
Socket.IO is used for signaling. It helps exchange offer/answer and ICE candidates required for establishing a WebRTC connection.
The app allows two users to join the same room using a room ID.
Once both users are in the room, the WebRTC connection is established, and the video streams are exchanged.


