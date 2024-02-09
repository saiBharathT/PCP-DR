import { LightningElement, api, wire,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import uploadFile from '@salesforce/apex/fileUploaderClass.uploadFile';
import getWorkspaceFolders from '@salesforce/apex/fileUploaderClass.getWorkspaceFolders';
import createLibrary from '@salesforce/apex/fileUploaderClass.createLibrary';
import {refreshApex} from '@salesforce/apex';
import getFileTypeOptions from '@salesforce/apex/fileUploaderClass.getFileTypeOptions';
import getRelatedFilesByRecordId from '@salesforce/apex/filePreviewAndDownloadController.getRelatedFilesByRecordId';
import deleteDocument from '@salesforce/apex/filePreviewAndDownloadController.deleteDocument';
import { NavigationMixin } from 'lightning/navigation';



export default class UploadAndDownloadPreview extends NavigationMixin(LightningElement) {
    @api recordId;
    fileData;
    fileType;
    selectedLibrary;
    LibName;
    checkspinner = false;
    folderOptions = [];
    _isButtonClicked = false;
    newLibraryName = '';
    showModal = false;
    folders;
    newLibraryId;

    @track ObjectForFile;
    filesList = [];
    @track ndata=false
    isRefreshing = false;
    @track showAllFiles = true;

    // Getter method to check if button is clicked
    get isButtonClicked() {
        return this._isButtonClicked;
    }

    // Getter method to check if button is disabled
    get isButtonDisabled() {
        return this.checkspinner || this.isButtonClicked;
    }

    // Wiring Apex method to fetch related files by record Id
    @wire(getRelatedFilesByRecordId, { recordId: '$recordId' })
    wiredResult(result) {
        this.ObjectForFile = result;

        if (result.data) {
            this.filesList = Object.keys(result.data).map(item => ({
                label: result.data[item],
                value: item,
                url: `/sfc/servlet.shepherd/document/download/${item}`
            }));
            this.ndata = this.filesList.length > 0;
        } else if (result.error) {
            console.error('Error fetching related files:', result.error);
        }
    }
    
    

    connectedCallback() {
        this.refreshData();
        
    }

    // Method to refresh data
    refreshData() {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            refreshApex(this.ObjectForFile)
                .then(() => {
                    console.log('Refreshed successfully');
                })
                .catch(error => {
                    console.error('Error refreshing files:', error);
                })
                .finally(() => {
                    this.isRefreshing = false;
                });
        }
    }

    // Method to handle preview button click
    previewHandler(event) {
        this.refreshData(); 
        console.log('Prievew Button Clicked')
        const selectedRecordId = event.target.dataset.id;
        console.log('selectedRecordId',selectedRecordId);
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                selectedRecordId
            }
        });
    }

    // Method to handle delete button click
    deleteHandler(event) {
         
        const isConfirmed = confirm("Are you sure you want to delete this File from the record ?");

        if (isConfirmed) {
            //this.checkspinner = true;

            const documentId = event.target.dataset.id;

            deleteDocument({ recordId: this.recordId, documentId })
                .then(() => {
                    this.toast('Deleted Successfully.', 'success');
                    this.refreshData();
                })
                .catch(error => {
                    console.error('Error deleting document:', error);
                    this.toast('Error deleting document.', 'error');
                })
                .finally(() => {
                    //this.checkspinner = false;
                    
                });
        }
    }

    
    // Method to display toast messages
    toast(title, variant) {
        const toastEvent = new ShowToastEvent({
            title,
            variant
        });
        this.dispatchEvent(toastEvent);
    }

    fileTypeOptions = [];

    // Wiring Apex method to fetch file type options
    @wire(getFileTypeOptions)
    wiredFileTypeOptions({ data, error }) {
        if (data) {
            console.log('line-37=>',data);
            this.fileTypeOptions = data.map(option => ({ label: option, value: option }));
        } else if (error) {
            console.error('Error retrieving file type options:', error);
        }
    }

    // Wiring Apex method to fetch workspace folders
    @wire(getWorkspaceFolders)
    wiredWorkspaceFolders(result) {
        
        this.folders = result;
        console.log('folders',this.folders);
        if (result.data) {
            this.folderOptions = result.data.map(folder => ({ label: folder.Name, value: folder.Id }));
        } else if (result.error) {
            console.error('Error retrieving workspace folders:', result.error);
        }
    }

    // Method to handle file upload
    openfileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                this.fileData = {
                    filename: this.getFileName(file.name),
                    base64: base64,
                    recordId: this.recordId,
                    fileType: this.fileType
                };
            };
            reader.readAsDataURL(file);
        }
    }

    // Method to handle file type change
    handleFileTypeChange(event) {
        this.fileType = event.detail.value;
        this.fileData = null;
        if (this.fileType) {
            this.fileData = {
                filename: this.getFileName(''), // You can set a default filename if needed
                base64: '',
                recordId: this.recordId,
                fileType: this.fileType
            };
        }
    }

    // Method to handle folder change
    handleFolderChange(event) {
        this.selectedLibrary = event.detail.value;
        this.LibName = event.target.options.find(opt => opt.value === event.detail.value).label;
    }


    // Method to open library modal
    openLibraryModal() {
        this.showModal = true;
    }
    // Method to close library modal
    closeLibraryModal() {
        this.showModal = false;
        this.selectedFolder = this.newLibraryId;
        console.log('this.newLibraryId',this.selectedFolder);
        this.newLibraryName = '';
    }

    // Method to handle button click(Submit)
    handleClick() {
        this._isButtonClicked = true;
        if (!this.fileType || !this.fileData) {
            this.toast("Please select file type and library before uploading.", "error");
            return;
        }

        const libraryId = this.selectedLibrary ? this.selectedLibrary : null;

        const { base64, filename, recordId } = this.fileData;

        this.checkspinner = true;
        this.refreshData(); 

        uploadFile({ base64, filename, recordId, library: libraryId })
            .then(result => {
                this.fileData = null;
                this.fileType = null; 
                this.selectedLibrary = null;
                this.LibName = libraryId ? this.folderOptions.find(folder => folder.value === libraryId).label : 'Other';
                let title = `${filename} uploaded successfully to ${this.LibName}!!`;
                this.toast(title, "success");
                
            })
            .catch(error => {
                if (error.body.message.includes("A file with the same name already exists")) {
                    let extensionIndex = filename.lastIndexOf('.'); // Find the last index of '.'
                    let prefix = filename.substring(0, 5); // Extract first five letters
                    let middle = filename.substring(5, extensionIndex); // Extract the middle part excluding the last extension
                    let suffix = filename.substring(extensionIndex); // Extract the last extension
                    let newMiddle = prompt(`A file with the same name already exists. Please enter a new filename. The first five letters and extension are not editable: ${prefix}${suffix}`, middle);
                    if (newMiddle !== null) {
                        let newFilename = prefix + newMiddle + suffix; // Combine the prefix, new middle, and suffix
                        this.fileData.filename = newFilename;
                        this.handleClick(); 
                        
                    } else {
                        this.toast('Upload canceled.', "warning");
                    }
                } else {
                    console.error('Error uploading file:', error);
                    console.error('Error object:', error); // Log the entire error object
                    this.toast('An error occurred. Please try again later.', "error");
                }
            })
            .finally(() => {
                this.checkspinner = false;
                this.selectedFolder = null;
                refreshApex(this.ObjectForFile);
                setTimeout(() => {
                    this._isButtonClicked = false;
                }, 6000);
 
            });
    }

    handleNewLibraryNameChange(event) {
        this.newLibraryName = event.target.value;
    }

    // Method to create a new library
    createLibrary() {
        if (!this.newLibraryName || this.newLibraryName.trim() === '') {
            this.toast('Please enter a valid library name.', 'error');
            return;
        }
        //this.checkspinner = true;
    
        createLibrary({ libraryName: this.newLibraryName })
            .then(result => {
                if (result.startsWith('Error')) {
                    console.error(result);
                    this.toast('Error creating library.', 'error');
                } else {
                    this.newLibraryId = result;
                    console.log('this.newLibraryId',this.newLibraryId);
                    this.selectedFolder = result;
                    console.log('this.selectedLibrary',this.selectedFolder);
                    this.newLibraryName = '';
                    this.toast(result, 'success');
                    this.closeLibraryModal();
                }
            })
            .catch(error => {
                console.error('Error creating library:', error);
                this.toast('Error creating library.', 'error');
            })
            .finally(() => {
                //this.checkspinner = false;
                refreshApex(this.folders);
            });
    }

    // Method to get formatted file name
    getFileName(originalFileName) {
        return `${this.fileType}_${originalFileName}`;
    }

    toast(title, variant) {
        const toastEvent = new ShowToastEvent({
            title,
            variant
        });
        this.dispatchEvent(toastEvent);
    }
}