import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProjectsForEmployee from '@salesforce/apex/ProjectRecordController.getProjectsForEmployee';

export default class ProjectRecordsList extends NavigationMixin(LightningElement) {
    @api recordId;
    projects;
    filteredProjects = [];
    @track ndata = false;

    columns = [
        {
            label: 'Project Name',
            fieldName: 'Id',
            type: 'url',
            typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' }
        }
        // Add more columns as needed
    ];

    @wire(getProjectsForEmployee, { employeeId: '$recordId' })
    wiredProjects({ error, data }) {
        if (data) {
            this.projects = data;
            this.ndata = this.projects.length > 0;

            this.filteredProjects = this.projects.map(project => ({
                Id: '/' + project.Id,
                Name: project.Name
            }));
        } else if (error) {
            console.error(error);
        }
    }

    handleRowAction(event) {
        const recordId = event.detail.row.Id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Project__c',
                actionName: 'view'
            }
        });
    }
}