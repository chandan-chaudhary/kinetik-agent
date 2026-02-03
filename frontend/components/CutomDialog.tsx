import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

interface dialogProps {
  title: string;
  description:string
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}
export default function CustomDialog({
  title,
  description,
  open,
  onOpenChange,
  children,
}: dialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* <DialogTrigger asChild></DialogTrigger> */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children ? (
          children
        ) : (
          <div className="w-full h-96">Configuration form</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
