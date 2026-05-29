// import { useEffect, useRef } from "react";

// // 👇 bypass broken typings
// // const pusherClient = new (Pusher as any)();
// // const pusherClient = new (Pusher as any).default?.() || new (Pusher as any)();
// const PusherLib = require("@pusher/pusher-websocket-react-native");
// const pusherClient = new PusherLib.default();
// let initialized = false;

// export const usePusherChannel = (
//   channelName: string,
//   eventName: string,
//   onEvent: (data: any) => void,
// ) => {
//   const channelRef = useRef<any>(null);

//   useEffect(() => {
//     const setup = async () => {
//       if (!initialized) {
//         await pusherClient.init({
//           apiKey: "YOUR_PUSHER_KEY",
//           cluster: "YOUR_PUSHER_CLUSTER",
//         });

//         await pusherClient.connect();
//         initialized = true;
//       }

//       channelRef.current = await pusherClient.subscribe({
//         channelName,
//         onEvent: (event: any) => {
//           if (event.eventName === eventName) {
//             onEvent(JSON.parse(event.data));
//           }
//         },
//       });
//     };

//     setup();

//     return () => {
//       pusherClient.unsubscribe({ channelName });
//     };
//   }, [channelName, eventName]);
// };

// hooks/usePusher.ts
// import Pusher from "@pusher/pusher-websocket-react-native";
// import { useEffect, useRef } from "react";

// const pusherClient = Pusher.getInstance();

// let initialized = false;

// export const usePusherChannel = (
//   channelName: string,
//   eventName: string,
//   onEvent: (data: any) => void,
// ) => {
//   const channelRef = useRef<any>(null);

//   useEffect(() => {
//     const setup = async () => {
//       if (!initialized) {
//         await pusherClient.init({
//           apiKey: "YOUR_PUSHER_KEY", // ← replace
//           cluster: "YOUR_PUSHER_CLUSTER", // ← replace e.g. "ap2"
//         });
//         await pusherClient.connect();
//         initialized = true;
//       }

//       channelRef.current = await pusherClient.subscribe({
//         channelName,
//         onEvent: (event: any) => {
//           if (event.eventName === eventName) {
//             onEvent(JSON.parse(event.data));
//           }
//         },
//       });
//     };

//     setup();

//     return () => {
//       pusherClient.unsubscribe({ channelName });
//     };
//   }, [channelName, eventName]);
// };

// import { useEffect, useRef } from "react";
// import Pusher from "pusher-js/react-native";

// export const usePusherChannel = (
//   channelName: string,
//   eventName: string,
//   onEvent: (data: any) => void,
// ) => {
//   const pusherRef = useRef<any>(null);
//   const channelRef = useRef<any>(null);

//   useEffect(() => {
//     const pusher = new Pusher("YOUR_PUSHER_KEY", {
//       cluster: "YOUR_PUSHER_CLUSTER",
//     });

//     const channel = pusher.subscribe(channelName);

//     channel.bind(eventName, (data: any) => {
//       onEvent(data);
//     });

//     pusherRef.current = pusher;
//     channelRef.current = channel;

//     return () => {
//       channel.unbind_all();
//       channel.unsubscribe();
//       pusher.disconnect();
//     };
//   }, [channelName, eventName]);
// };

import Pusher from "pusher-js";
import { useEffect, useRef } from "react";

export const usePusherChannel = (
  channelName: string,
  eventName: string,
  onEvent: (data: any) => void,
) => {
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const pusher = new Pusher("YOUR_PUSHER_KEY", {
      cluster: "YOUR_PUSHER_CLUSTER",
    });

    const channel = pusher.subscribe(channelName);

    channel.bind(eventName, (data: any) => {
      onEvent(data);
    });

    pusherRef.current = pusher;
    channelRef.current = channel;

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [channelName, eventName]);
};
