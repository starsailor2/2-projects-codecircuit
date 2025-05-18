// History Manager for Undo/Redo Functionality
class HistoryManager {
    constructor(maxHistory = 30) {
        this.history = [];
        this.future = [];
        this.maxHistory = maxHistory;
        this.isPerformingAction = false;
    }
    
    // Add a new state to history
    addState(state, actionDescription) {
        if (this.isPerformingAction) return;
        
        // Clone the state to avoid reference issues
        const clonedState = JSON.parse(JSON.stringify(state));
        
        // Add to history with timestamp and description
        this.history.push({
            state: clonedState,
            timestamp: new Date(),
            description: actionDescription || 'Action'
        });
        
        // Clear future when a new action is performed
        this.future = [];
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    // Undo the last action
    undo() {
        if (this.history.length <= 1) {
            return null; // No history or only initial state
        }
        
        this.isPerformingAction = true;
        
        // Move current state to future
        const current = this.history.pop();
        this.future.push(current);
        
        // Return the previous state
        const previousState = this.history[this.history.length - 1];
        
        this.isPerformingAction = false;
        
        return previousState ? previousState.state : null;
    }
    
    // Redo the last undone action
    redo() {
        if (this.future.length === 0) {
            return null; // No future state
        }
        
        this.isPerformingAction = true;
        
        // Move future state back to history
        const futureState = this.future.pop();
        this.history.push(futureState);
        
        this.isPerformingAction = false;
        
        return futureState.state;
    }
    
    // Check if undo is available
    canUndo() {
        return this.history.length > 1;
    }
    
    // Check if redo is available
    canRedo() {
        return this.future.length > 0;
    }
    
    // Get undo description
    getUndoDescription() {
        if (!this.canUndo()) return '';
        const lastAction = this.history[this.history.length - 1];
        return lastAction.description;
    }
    
    // Get redo description
    getRedoDescription() {
        if (!this.canRedo()) return '';
        return this.future[this.future.length - 1].description;
    }
    
    // Clear all history
    clear() {
        this.history = [];
        this.future = [];
    }
}
