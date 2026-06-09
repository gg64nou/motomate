export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

class ToastStore {
	items = $state<Toast[]>([]);

	add(message: string, type: ToastType = 'info', duration?: number) {
		const id = Math.random().toString(36).slice(2);
		const defaultDuration = type === 'success' ? 5000 : type === 'info' ? 4000 : 0;
		const resolved = duration ?? defaultDuration;
		this.items = [...this.items, { id, type, message, duration: resolved }];
		if (resolved !== 0) {
			setTimeout(() => this.remove(id), resolved);
		}
	}

	remove(id: string) {
		this.items = this.items.filter((t) => t.id !== id);
	}

	success(message: string, duration?: number) {
		this.add(message, 'success', duration);
	}

	error(message: string, duration?: number) {
		this.add(message, 'error', duration);
	}

	info(message: string, duration?: number) {
		this.add(message, 'info', duration);
	}
}

export const toasts = new ToastStore();
