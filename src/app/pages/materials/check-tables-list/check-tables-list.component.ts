import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CheckTableService } from '@/app/core/services/check-table.service';
import { CheckTable } from '@/app/core/models/check-table.model';

@Component({
    selector: 'app-check-tables-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        AutoCompleteModule,
        ChipModule,
        ProgressSpinnerModule,
        ButtonModule,
        TooltipModule,
        ToastModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService],
    templateUrl: './check-tables-list.component.html',
    styleUrls: ['./check-tables-list.component.scss']
})
export class CheckTablesListComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    private checkTableService = inject(CheckTableService);
    private messageService = inject(MessageService);

    // Check tables state
    selectedTable = signal<CheckTable | null>(null);
    filteredTables = signal<CheckTable[]>([]);
    
    checkTables = this.checkTableService.checkTables;
    isLoading = this.checkTableService.isLoading;
    error = this.checkTableService.error;

    // Voice Recognition
    isListening = signal<boolean>(false);
    private recognition: any;
    private _searchText = signal<string>('');
    
    // Debounced search - only for autocomplete suggestions, not for chip filtering
    private autoCompleteSubject = new Subject<string>();

    // Getter/setter for ngModel binding
    get searchText(): string {
        return this._searchText();
    }
    
    set searchText(value: string) {
        const previousValue = this._searchText();
        this._searchText.set(value);
        
        // Stop voice recognition if search field is manually cleared
        if (previousValue && !value && this.isListening() && this.recognition) {
            console.log('Search field cleared manually - stopping voice recognition');
            this.recognition.stop();
        }
    }

    // Computed: visible tables based on search
    visibleTables = computed(() => {
        const search = this._searchText().toLowerCase().trim();
        const tables = this.checkTables();
        
        if (!search) {
            return tables;
        }
        
        return tables.filter(table => {
            const displayName = this.getTableDisplayName(table).toLowerCase();
            return displayName.includes(search);
        });
    });

    ngOnInit() {
        // Load check tables if not already loaded
        if (this.checkTables().length === 0) {
            this.checkTableService.fetchCheckTables().subscribe();
        }
        
        // Read search query parameter if present
        this.activatedRoute.queryParams.subscribe(params => {
            const searchTerm = params['search'];
            if (searchTerm) {
                console.log('Setting search term from query param:', searchTerm);
                this._searchText.set(searchTerm);
            }
        });
        
        this.initializeVoiceRecognition();
        this.setupDebouncedSearch();
    }

    ngOnDestroy() {
        this.autoCompleteSubject.complete();
    }

    /**
     * Setup debounced search for autocomplete
     */
    private setupDebouncedSearch(): void {
        // Debounced search for autocomplete dropdown suggestions only
        this.autoCompleteSubject
            .pipe(
                debounceTime(300),
                distinctUntilChanged()
            )
            .subscribe((query) => {
                this.performAutoCompleteFilter(query);
            });
    }

    /**
     * Initialize Web Speech API for voice recognition
     */
    private initializeVoiceRecognition(): void {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true; // Keep listening for longer
            this.recognition.interimResults = true; // Capture interim results
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

            let lastTranscript = ''; // Track last transcript to avoid duplicates

            this.recognition.onstart = () => {
                console.log('Voice recognition started - please speak now');
                this.isListening.set(true);
                lastTranscript = ''; // Reset on start
                this.messageService.add({
                    severity: 'info',
                    summary: 'Listening',
                    detail: 'Speak now to search...',
                    life: 2000
                });
            };

            this.recognition.onend = () => {
                console.log('Voice recognition ended');
                this.isListening.set(false);
            };

            this.recognition.onresult = (event: any) => {
                console.log('Voice recognition onresult fired');
                console.log('Total results:', event.results.length);
                console.log('Result index:', event.resultIndex);
                
                let finalTranscript = '';
                let interimTranscript = '';
                
                // Process ALL results to build complete transcript
                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    const transcript = result[0].transcript;
                    
                    console.log(`Result ${i}: isFinal=${result.isFinal}, transcript="${transcript}", confidence=${result[0].confidence}`);
                    
                    if (result.isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript + ' ';
                    }
                }
                
                // Prefer final transcript, fall back to interim
                const transcriptToUse = finalTranscript.trim() || interimTranscript.trim();
                const isFinal = finalTranscript.length > 0;
                
                console.log(`Final transcript: "${finalTranscript.trim()}"`);
                console.log(`Interim transcript: "${interimTranscript.trim()}"`);
                console.log(`Using transcript: "${transcriptToUse}", isFinal: ${isFinal}`);
                
                if (transcriptToUse && transcriptToUse.length > 0 && transcriptToUse !== lastTranscript) {
                    console.log('Processing new voice input:', transcriptToUse);
                    lastTranscript = transcriptToUse;
                    this.handleVoiceInput(transcriptToUse);
                    
                    // Stop after getting a final result
                    if (isFinal) {
                        console.log('Got final result, stopping recognition');
                        this.recognition.stop();
                    }
                } else if (!transcriptToUse || transcriptToUse.length === 0) {
                    console.warn('Empty transcript received');
                } else {
                    console.log('Duplicate transcript, ignoring');
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error('Voice recognition error:', event.error);
                this.isListening.set(false);
                
                let errorMessage = '';
                let errorDetail = '';
                
                switch(event.error) {
                    case 'no-speech':
                        errorMessage = 'No Speech Detected';
                        errorDetail = 'Please speak clearly right after clicking the microphone button.';
                        break;
                    case 'audio-capture':
                        errorMessage = 'Microphone Error';
                        errorDetail = 'No microphone detected. Please connect a microphone and try again.';
                        break;
                    case 'not-allowed':
                        errorMessage = 'Permission Denied';
                        errorDetail = 'Please allow microphone access in your browser settings.';
                        break;
                    case 'network':
                        errorMessage = 'Network Error';
                        errorDetail = 'Voice recognition requires an internet connection.';
                        break;
                    case 'aborted':
                        console.log('Recognition was aborted, likely user stopped it manually');
                        return; // Don't show error for manual stops
                    default:
                        errorMessage = 'Voice Recognition Error';
                        errorDetail = `Error: ${event.error}`;
                }
                
                this.messageService.add({
                    severity: 'error',
                    summary: errorMessage,
                    detail: errorDetail,
                    life: 5000
                });
            };
            
            // Add speech start event
            this.recognition.onspeechstart = () => {
                console.log('Speech detected - recognition is processing...');
            };
            
            // Add speech end event
            this.recognition.onspeechend = () => {
                console.log('Speech ended - waiting for final results...');
                // Give it a moment to process final results before stopping
                setTimeout(() => {
                    if (this.isListening()) {
                        console.log('Timeout after speech end, stopping recognition');
                        this.recognition.stop();
                    }
                }, 500);
            };
            
            // Add audio start event
            this.recognition.onaudiostart = () => {
                console.log('Audio capturing started');
            };
            
            // Add audio end event  
            this.recognition.onaudioend = () => {
                console.log('Audio capturing ended');
            };
            
            // Add sound start event
            this.recognition.onsoundstart = () => {
                console.log('Sound detected');
            };
            
            // Add sound end event
            this.recognition.onsoundend = () => {
                console.log('Sound ended');
            };
            
            console.log('Voice recognition initialized successfully with all event handlers');
        } else {
            console.warn('Speech Recognition not supported in this browser');
            this.messageService.add({
                severity: 'warn',
                summary: 'Voice Recognition Not Supported',
                detail: 'Your browser does not support voice recognition. Please use Chrome or Edge.',
                life: 5000
            });
        }
    }

    /**
     * Start voice recognition or stop if already listening
     */
    startVoiceRecognition(): void {
        if (!this.recognition) {
            console.warn('Voice recognition not initialized');
            this.messageService.add({
                severity: 'warn',
                summary: 'Voice Recognition Not Available',
                detail: 'Voice recognition is not available in your browser.',
                life: 3000
            });
            return;
        }
        
        // If already listening, stop it
        if (this.isListening()) {
            console.log('Stopping voice recognition manually...');
            this.recognition.stop();
            return;
        }
        
        // Start listening
        try {
            console.log('Starting voice recognition...');
            this.recognition.start();
        } catch (e: any) {
            console.error('Failed to start voice recognition:', e);
            
            // Handle case where recognition is already started
            if (e.message && e.message.includes('already started')) {
                console.log('Recognition already running, stopping it first');
                this.recognition.stop();
                setTimeout(() => {
                    this.recognition.start();
                }, 100);
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to Start',
                    detail: 'Could not start voice recognition. Please check microphone permissions.',
                    life: 3000
                });
            }
        }
    }

    /**
     * Handle voice input - update search field with debouncing
     */
    private handleVoiceInput(transcript: string): void {
        const trimmedText = transcript.trim();
        console.log('Raw voice input:', trimmedText);
        
        // Process the transcript to handle spelled-out characters
        const processedText = this.processVoiceTranscript(trimmedText);
        console.log('Processed voice input:', processedText);
        
        // Show immediate feedback message
        this.messageService.add({
            severity: 'info',
            summary: 'Voice Search',
            detail: `Searching for: "${processedText}"`,
            life: 2000
        });
        
        // Update searchText immediately for faster visual feedback
        this._searchText.set(processedText);
    }

    /**
     * Process voice transcript to handle spelled-out letters and numbers
     * Converts "A E N R" or "a e n r" to "AENR"
     * Handles numbers like "zero", "one", etc.
     * Handles phonetic letter pronunciations like "tee" -> "T"
     */
    private processVoiceTranscript(transcript: string): string {
        console.log('Processing transcript:', transcript);
        
        // Convert to uppercase first
        let processed = transcript.toUpperCase();
        
        // Replace phonetic letter pronunciations with single letters
        const letterWords: { [key: string]: string } = {
            'AY': 'A', 'EY': 'A',
            'BEE': 'B', 'BE': 'B',
            'SEE': 'C', 'CEE': 'C',
            'DEE': 'D', 'DE': 'D',
            'EE': 'E',
            'EFF': 'F',
            'GEE': 'G', 'JEE': 'G',
            'AITCH': 'H', 'ACHE': 'H',
            'EYE': 'I', 'AYE': 'I',
            'JAY': 'J',
            'KAY': 'K',
            'ELL': 'L', 'EL': 'L',
            'EMM': 'M', 'EM': 'M',
            'ENN': 'N', 'EN': 'N',
            'PEE': 'P', 'PEA': 'P',
            'CUE': 'Q', 'QUEUE': 'Q',
            'ARE': 'R', 'ARR': 'R',
            'ESS': 'S', 'ES': 'S',
            'TEE': 'T', 'TEA': 'T',
            'YOU': 'U', 'YOO': 'U',
            'VEE': 'V',
            'DOUBLE YOU': 'W', 'DOUBLEYOU': 'W',
            'EX': 'X',
            'WHY': 'Y', 'WYE': 'Y',
            'ZED': 'Z', 'ZEE': 'Z'
        };
        
        // Replace spelled-out numbers with digits
        const numberWords: { [key: string]: string } = {
            'ZERO': '0', 'OH': '0', 'O': '0',
            'ONE': '1', 'WON': '1',
            'TWO': '2', 'TO': '2', 'TOO': '2',
            'THREE': '3', 'TREE': '3',
            'FOUR': '4', 'FOR': '4', 'FORE': '4',
            'FIVE': '5', 'FIFE': '5',
            'SIX': '6',
            'SEVEN': '7',
            'EIGHT': '8', 'ATE': '8',
            'NINE': '9', 'NINER': '9'
        };
        
        // First, replace letter words with single letters
        Object.keys(letterWords).forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            processed = processed.replace(regex, letterWords[word]);
        });
        
        // Then replace number words with digits
        Object.keys(numberWords).forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            processed = processed.replace(regex, numberWords[word]);
        });
        
        console.log('After replacements:', processed);
        
        // Check if it looks like individual letters/numbers were spoken
        // (e.g., "A E N R" or "T 1 7 8")
        const parts = processed.split(/\s+/).filter(p => p.length > 0);
        console.log('Parts:', parts);
        
        const allShortParts = parts.every(part => part.length <= 2);
        
        if (allShortParts && parts.length > 1) {
            // Remove spaces between individual characters
            processed = parts.join('');
            console.log('Detected spelled-out characters, removed spaces:', processed);
        }
        
        console.log('Final processed result:', processed);
        return processed;
    }

    /**
     * Filter check tables based on search query (with debouncing)
     */
    filterTables(event: any) {
        const query = event.query?.trim() || '';
        this.autoCompleteSubject.next(query);
    }

    /**
     * Perform the actual autocomplete filtering
     */
    private performAutoCompleteFilter(query: string): void {
        const lowerQuery = query.toLowerCase();
        const allTables = this.checkTableService.checkTables();
        
        if (!lowerQuery || lowerQuery === '') {
            this.filteredTables.set(allTables);
        } else {
            const filtered = allTables.filter((table: CheckTable) => {
                const displayName = this.getTableDisplayName(table).toLowerCase();
                return displayName.includes(lowerQuery);
            });
            this.filteredTables.set(filtered);
        }
    }

    /**
     * Handle table selection from dropdown
     */
    onTableSelect(event: any) {
        const table = (event?.value || event) as CheckTable;
        if (table && typeof table === 'object') {
            const tableName = this.getTableDisplayName(table);
            this.router.navigate(['/materials/check-table', tableName]);
        }
    }

    /**
     * Navigate to a specific check table
     */
    navigateToTable(table: CheckTable) {
        const tableName = this.getTableDisplayName(table);
        const currentSearch = this._searchText();
        
        // Pass the current search term so we can return to the same search results
        if (currentSearch) {
            this.router.navigate(['/materials/check-table', tableName], {
                queryParams: { from: currentSearch }
            });
        } else {
            this.router.navigate(['/materials/check-table', tableName]);
        }
    }

    /**
     * Get display name for a check table
     */
    getTableDisplayName(table: CheckTable | null | undefined): string {
        if (!table) return '';
        return this.checkTableService.getDisplayName(table);
    }

    /**
     * Clear the search field and show all tables
     */
    clearSearch(): void {
        this._searchText.set('');
        this.selectedTable.set(null);
        
        // Stop voice recognition if it's currently active
        if (this.isListening() && this.recognition) {
            console.log('Clearing search - stopping voice recognition');
            this.recognition.stop();
        }
    }
}
