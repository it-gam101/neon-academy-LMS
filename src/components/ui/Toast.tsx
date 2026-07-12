import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const toastListeners: Set<(toast: ToastMessage) => void> = new Set();

// eslint-disable-next-line react-refresh/only-export-components
export function showToast(type: ToastMessage['type'], message: string) {
  const toast: ToastMessage = {
    id: Date.now().toString(),
    type,
    message
  };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };

    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div data-ev-id="ev_726582da0d" className="fixed bottom-4 inset-inline-end-4 z-50 flex flex-col gap-2">
			{toasts.map((toast) =>
      <div data-ev-id="ev_f084afc5d0"
      key={toast.id}
      className={`flex items-center gap-3 p-4 rounded-lg shadow-lg min-w-[300px] animate-in slide-in-from-end-5 ${
      toast.type === 'success' ? 'bg-primary/10 border border-primary/30' :
      toast.type === 'error' ? 'bg-destructive/10 border border-destructive/30' :
      'bg-card border border-border'}`
      }
      role="alert">

					{toast.type === 'success' && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
					{toast.type === 'error' && <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />}
					{toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />}
					<span data-ev-id="ev_317fa1967b" className="flex-1 text-sm text-foreground">{toast.message}</span>
					<button data-ev-id="ev_2298039ac4"
        onClick={() => removeToast(toast.id)}
        className="p-1 rounded hover:bg-muted transition-colors">

						<X className="w-4 h-4 text-muted-foreground" />
					</button>
				</div>
      )}
		</div>);

}