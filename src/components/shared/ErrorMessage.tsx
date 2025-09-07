import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  message: string;
  retry: () => void;
}

export default function ErrorMessage({ message, retry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-red-500">{message}</p>
      <Button onClick={retry}>Retry</Button>
    </div>
  );
}
