import ChatClient from "./ChatClient";

export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function ChatPage() {
  return <ChatClient />;
}
