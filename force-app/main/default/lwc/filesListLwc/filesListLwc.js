import { LightningElement, wire, track } from 'lwc';
import getFiles from '@salesforce/apex/fileUploaderClass.getFiles';
import deleteDoc from '@salesforce/apex/filePreviewAndDownloadController.deleteDoc'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getFileTypeOptions from '@salesforce/apex/fileUploaderClass.getFileTypeOptions';

const columns = [
    {
        label: 'Title',
        fieldName: 'accLink',
        type: 'url',
        typeAttributes: { label: { fieldName: 'Title' }, target: '_blank' }
    },{
        label: 'Last Modified Date',
        fieldName: 'formattedLastModifiedDate',
        type: 'text'
        
    }
];

export default class FilesListLWC extends LightningElement {
    @track checkspinner = false;
    @track files;
    @track originalFiles;
    @track columns = columns;
    @track searchKey = '';
    @track selectedFileType = 'all';
    @track commanObject;
    @track automaticSetHeight;
    // Define your file types and initialize the fileTypeOptions
    fileTypeOptions = [];

    @wire(getFileTypeOptions)
    wiredFileTypeOptions({ data, error }) {
        if (data) {
            console.log('line-37=>',data);
            this.fileTypeOptions = data.map(option => ({ label: option, value: option }));
        } else if (error) {
            console.error('Error retrieving file type options:', error);
        }
    }

    @wire(getFiles)
    wiredAccounts(result) {
        this.commanObject = result;
        if (result.data) {
            result.data = JSON.parse(JSON.stringify(result.data));
            result.data.forEach(res => {
                res.accLink = '/' + res.Id;
                res.formattedLastModifiedDate = this.formatDate(res.LastModifiedDate);
            });

            this.filteredFiles = result.data;

            this.automaticSetHeight = this.filteredFiles.length > 0 ? 'height:330px' : 'height:35px';

            this.originalFiles = result.data;
        } else if (result.error) {
            console.error('Error loading files', result.error);
        }
    }
    formatDate(dateString) {
        const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // Include AM/PM indicator
        };
        const formattedDate = new Date(dateString).toLocaleDateString(undefined, options);
        const formattedString = formattedDate.replace(/(\/|,|\s)/g, '-'); // Replace characters for a consistent format
        return formattedString.replace(' ', '--').replace('--', ' , ');
    }
    handleRowAction(event) {
        var selectedRows = this.template.querySelector("lightning-datatable").getSelectedRows();
        
        this.checkspinner=true;
            setTimeout(() => {
                this.checkspinner = false;
            }, 2000);

            deleteDoc({ documentIdList:selectedRows })
                .then(() => {
                    this.refreshFilesList();
                    this.toast("Deleted Successfully.", "success");
                })
                .catch(error => {
                    console.error('Error deleting document:', error);
                    this.toast("Error deleting document.", "error");
                })
                .finally(() => {
                    refreshApex(this.commanObject);
                });
        }
    

    refreshFilesList() {
        getFiles()
            .then(data => {
                console.log('Refresh List is called');
                data = JSON.parse(JSON.stringify(data));
                data.forEach(res => {
                    res.accLink = '/' + res.Id;
                });
                this.filteredFiles = data;
                this.originalFiles = data;
            })
            .catch(error => {
                console.error('Error refreshing file list:', error);
            });
    }

    toast(title, variant) {
        const toastEvent = new ShowToastEvent({
            title,
            variant
        });
        this.dispatchEvent(toastEvent);
    }

    handleSearch(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.filterFiles();
    }

    // Handle combobox change
    handleFileTypeChange(event) {
        this.selectedFileType = event.detail.value;
        console.log('this.selectedFileType',this.selectedFileType);
        this.filterFiles();
        
        console.log('this.searchKey',this.searchKey);
    }

    // Function to filter files based on search key and selected file type
    filterFiles() {
        if (this.selectedFileType === 'All') {
            this.filteredFiles = this.originalFiles;
        } else {
            
            this.filteredFiles = this.originalFiles.filter(file => {
                return file.Title.startsWith(this.selectedFileType);
            });
        }
    }
}