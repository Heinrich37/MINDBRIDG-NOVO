import ConversationClient from "./ConversationClient";

export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function CounselorConversationPage() {
  return <ConversationClient />;
}
