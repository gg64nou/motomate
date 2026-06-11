export type QuickAddEntryType = 'service' | 'odometer' | 'note';

class QuickAddState {
	isOpen = $state(false);
	vehicleId = $state<string | null>(null);
	entryType = $state<QuickAddEntryType | null>(null);

	open(vehicleId: string, entryType: QuickAddEntryType = 'service') {
		this.isOpen = true;
		this.vehicleId = vehicleId;
		this.entryType = entryType;
	}

	close() {
		this.isOpen = false;
		this.vehicleId = null;
		this.entryType = null;
	}

	toggle(vehicleId: string) {
		if (this.isOpen && this.vehicleId === vehicleId) {
			this.close();
		} else {
			this.open(vehicleId);
		}
	}
}

export const quickAdd = new QuickAddState();
