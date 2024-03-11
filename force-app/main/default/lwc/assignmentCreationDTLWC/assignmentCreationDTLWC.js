import { LightningElement, track, wire, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import Status_Field from "@salesforce/schema/Assignment__c.Status__c";
import Priority_Field from "@salesforce/schema/Assignment__c.Priority__c";
import AssignmentType_Field from "@salesforce/schema/Assignment__c.Assignment_Type__c";
import { getObjectInfo,getPicklistValues } from 'lightning/uiObjectInfoApi';
import Assignment_Object from '@salesforce/schema/Assignment__c';
import createAssignment from '@salesforce/apex/AssignmentCreationHandler.createAssignment';
import deleteAssignmentAndSubassignment from '@salesforce/apex/AssignmentCreationHandler.deleteAssignmentAndSubassignment';
import getRelatedTeamMembers from '@salesforce/apex/AssignmentCreationHandler.getRelatedTeamMembers';
import getProjectDetails from '@salesforce/apex/AssignmentCreationHandler.getProjectDetails';
import getParentAssignments from '@salesforce/apex/AssignmentCreationHandler.getParentAssignments';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';



export default class AssignmentCreation extends LightningElement {
    @track assignments = [];
    wiredAssignments;
    @track optionsname;
    isRefreshing = false;
    @api recordId;

    @track buttonColor1 = 'neutral';
    @track buttonColor2 = 'neutral';
    @track combineObject;

    statusOptions = [];
    priorityOptions = [];
    AssignmenttypeOptions = [];
    
    
    Assigned_To__cOptions;
    Related_To__cOptions;
    ParentOptions;


    @wire(getObjectInfo, {objectApiName:Assignment_Object})
    AssignmentObjectInfo

    @wire(getPicklistValues, {
        recordTypeId:'$AssignmentObjectInfo.data.defaultRecordTypeId',
        fieldApiName: Status_Field
        
    })
    picklistResults({ error, data }) {
        if (data) {
            //console.log('Line 29',JSON.stringify(data.values));
            this.statusOptions = data.values;
        } else if (error) {
            //console.log('Line 31',JSON.stringify(error));

        }
    }


    @wire(getPicklistValues, {
        recordTypeId:'$AssignmentObjectInfo.data.defaultRecordTypeId',
        fieldApiName: Priority_Field
        
    })
    picklistPrior({ error, data }) {
        if (data) {
            //console.log('Line 50',JSON.stringify(data.values));
            this.priorityOptions = data.values;
        } else if (error) {
           // console.log('Line 53',JSON.stringify(error));

        }
    }


    @wire(getPicklistValues, {
        recordTypeId:'$AssignmentObjectInfo.data.defaultRecordTypeId',
        fieldApiName: AssignmentType_Field
        
    })
    picklistType({ error, data }) {
        if (data) {
            //console.log('Line 50',JSON.stringify(data.values));
            this.AssignmenttypeOptions = data.values;
        } else if (error) {
           // console.log('Line 53',JSON.stringify(error));

        }
    }

    connectedCallback() {
        this.fetchRelatedToOptions();
        this.refreshData();
    }
    

    fetchRelatedToOptions() {
        getProjectDetails({ recordId: this.recordId })
        .then(result => {
            let temp=[];
        for (let i = 0; i < result.length; i++) {
            let obj = {
                label: result[i].Name,
                value: result[i].Id
            };
            temp.push(obj);
        }
        console.log('getting team members',JSON.stringify(temp));
        this.Related_To__cOptions = temp;
        //this.Related_To_cOptions_Child = temp;
        })
        .catch(error => {
            console.error('Error fetching related Team members:', error);
        });
    }
    
    
    @wire(getParentAssignments)
    wiredLookup(result) {
        this.optionsname = result;
        console.log('optionsname 110',this.optionsname);
        const { data, error } = result;
        if (data) {
            console.log('Inside getParentAssignments', JSON.stringify(data));
            let temp = data.map(item => ({
                label: item.Name,
                value: item.Id
            }));
            console.log('ParentAssignment-----', JSON.stringify(temp));
            this.ParentOptions = temp;
        } else if (error) {
            console.error('Error fetching project names:', error);
        }
    }
    
    refreshData() {
        if (this.optionsname) {
            refreshApex(this.optionsname)
                .then(() => {
                    console.log('Refreshed successfully');
                })
                .catch(error => {
                    console.error('Error refreshing files:', error);
                });
        }
    }
    


    addAssignment() {
        this.buttonColor1 = 'brand';
        this.buttonColor2 = 'neutral';

        this.assignments = [
            ...this.assignments,
            {
                Id: this.generateId(),
                Sno: this.assignments.length + 1,
                Name: '',
                Related_To__c: '',
                Assigned_To__c: '',
                Subject__c: '',
                Status__c: '',
                Due_Date__c:'',
                Assignment_Type__c:'',
                Priority__c: '',
                showChildRows: false,
                subassignments: []
            }
        ];
    }

    toggleChildRows(event) {
        const rowId = event.target.dataset.id;
        const index = this.findIndexById(rowId);
        this.assignments[index].showChildRows = !this.assignments[index].showChildRows;
    }

    addSubassignment(event) {
        const parentId = event.target.dataset.id;
        const parentIndex = this.findIndexById(parentId);
        this.addSubassignmentToParent(parentIndex);
    }
    
    addSubassignmentToParent(parentIndex) {
        let tempList = [...this.assignments];
        const parentAssignment = tempList[parentIndex];
        parentAssignment.subassignments = parentAssignment.subassignments || [];
        const subAssignmentNumber = parentAssignment.subassignments.length + 1;

        const newSubAssignment = {
            Id: this.generateId(),
            Sno: parseFloat(parentAssignment.Sno + '.' + subAssignmentNumber),
            Name: '',
            Related_To__c: '',
            Assigned_To__c: '',
            Subject__c: '',
            Status__c: '',
            Priority__c: '',
            Due_Date__c:'',
            Assignment_Type__c:'',
            Parent_Assignment__c:'',
            parentId: parentAssignment.Id
        };
        console.log('parentId:', newSubAssignment.parentId);

        parentAssignment.subassignments.push(newSubAssignment);
        parentAssignment.showChildRows = true;
        this.assignments = [...tempList];
    }
    
    handleDelete(event) {
        const rowId = event.target.dataset.id;
        console.log(rowId);
        const index = this.findIndexById(rowId);
        console.log(index);

        this.assignments.splice(index, 1);
        this.assignments = [...this.assignments];
    }

    // handleDelete(event) {
    //     const rowId = event.target.dataset.id;
    //     console.log(rowId);
    //     const index = this.findIndexById(rowId);
    //     console.log(index);

    //     const assignmentToDelete = this.assignments[index];

    // //     // Make a call to Apex to delete the assignment and its subassignments
    // //     deleteAssignmentAndSubassignment({ assignmentId: assignmentToDelete.Id })
    // //         .then(() => {
    // //             // Successfully deleted
    // //             const event = new ShowToastEvent({
    // //                 title: 'Success',
    // //                 message: 'Assignment and its subassignments deleted successfully!',
    // //                 variant: 'success',
    // //             });
    // //             this.dispatchEvent(event);

    // //             // Remove the assignment from the local array
    // //             this.assignments.splice(index, 1);
    // //             this.assignments = [...this.assignments];
    // //         })
    // //         .catch(error => {
    // //             console.error('Error deleting assignment and subassignments:', error);

    // //             // Show error message
    // //             const event = new ShowToastEvent({
    // //                 title: 'Error',
    // //                 message: 'Error deleting assignment and subassignments',
    // //                 variant: 'error',
    // //             });
    // //             this.dispatchEvent(event);
    // //         });
    // // }


    handleDeleteSubassignment(event) {
        const rowId = event.target.dataset.id;
        const parentId = event.target.dataset.parentId;
        const parentIndex = this.findIndexById(parentId);
        const subIndex = this.findIndexById(rowId, parentIndex);

        if (parentIndex !== -1 && subIndex !== -1) {
            const parentAssignment = this.assignments[parentIndex];
            const deletedSubassignment = parentAssignment.subassignments.splice(subIndex, 1)[0];

            if (deletedSubassignment && deletedSubassignment.Id) {
            }

            this.assignments = [...this.assignments];
        }
    }


    // handleDeleteSubassignment(event) {
    //     const rowId = event.target.dataset.id;
    //     const parentId = event.target.dataset.parentId;
    //     const parentIndex = this.findIndexById(parentId);
    //     const subIndex = this.findIndexById(rowId, parentIndex);

    //     if (parentIndex !== -1 && subIndex !== -1) {
    //         const parentAssignment = this.assignments[parentIndex];
    //         const subassignmentToDelete = parentAssignment.subassignments[subIndex];

    //         // Make a call to Apex to delete the subassignment
    //         deleteAssignmentAndSubassignment({ assignmentId: parentId, subassignmentIds: [subassignmentToDelete.Id] })
    //             .then(() => {
    //                 // Successfully deleted
    //                 const event = new ShowToastEvent({
    //                     title: 'Success',
    //                     message: 'Subassignment deleted successfully!',
    //                     variant: 'success',
    //                 });
    //                 this.dispatchEvent(event);

    //                 // Remove the subassignment from the local array
    //                 parentAssignment.subassignments.splice(subIndex, 1);
    //                 this.assignments = [...this.assignments];
    //             })
    //             .catch(error => {
    //                 console.error('Error deleting subassignment:', error);

    //                 // Show error message
    //                 const event = new ShowToastEvent({
    //                     title: 'Error',
    //                     message: 'Error deleting subassignment',
    //                     variant: 'error',
    //                 });
    //                 this.dispatchEvent(event);
    //             });
    //     }
    // }



    handleInputChange(event) {
        const rowId = event.target.dataset.id;
        const parentId = event.target.dataset.parentId;
        const field = event.target.dataset.field;
        const value = event.target.value;

            if (field === 'Related_To__c') {
                this.loadAssignedToOptions(rowId, value);
                //this.loadAssignedToOptions(parentId, value);
            }

            if (parentId) {
                const parentIndex = this.findIndexById(parentId);
                const subIndex = this.findIndexById(rowId, parentIndex);
                this.assignments[parentIndex].subassignments[subIndex][field] = value;
            } else {
                const index = this.findIndexById(rowId);
                this.assignments[index][field] = value;
            }
    }


    loadAssignedToOptions(rowId, selectedProjectId) {
        console.log('line:249 project Id : ',selectedProjectId);
        console.log('line-251 record id : ',this.recordId);
        // Get the list of users that are not already assigned to this project
        getRelatedTeamMembers({ projectId:selectedProjectId })
            .then(result => {
                let temp=[];
            for (let i = 0; i < result.length; i++) {
                let obj = {
                    label: result[i].Name,
                    value: result[i].Id
                };
                temp.push(obj);
            }
            console.log('getting team members',JSON.stringify(temp));
            this.Assigned_To__cOptions = temp;
            })
            .catch(error => {
                console.error('Error fetching related Team members:', error);
            });
        }
    

    generateId() {
        return Date.now().toString();
    }

    findIndexById(id, parentIndex = -1) {
        if (parentIndex !== -1) {
            return this.assignments[parentIndex].subassignments.findIndex(subassignment => subassignment.Id === id);
        } else {
            
            return this.assignments.findIndex(assignment => assignment.Id === id);
        }
    }

    handleSave() {
   //for changing the color of the save button.
    this.buttonColor1 = 'neutral';
    this.buttonColor2 = 'brand';

    //....//
    if (this.assignments && this.assignments.length > 0) {
        console.log('line: 427 : ',this.assignments);
        console.log('line: 427 name : ',JSON.stringify(this.assignments.Name));
        const parentAssignments = this.assignments.filter(assignment => !assignment.parentId);

        // Save parent assignments
        const parentAssignmentsData = { 
            assignmentWrapper: JSON.stringify(
                parentAssignments.map(assignment => ({
                    assignmentName: assignment.Name,
                    relatedTo: assignment.Related_To__c,
                    assignedTo: assignment.Assigned_To__c,
                    subject: assignment.Subject__c,
                    status: assignment.Status__c,
                    dueDate:assignment.Due_Date__c,
                    assignmentType:assignment.Assignment_Type__c,
                    priority: assignment.Priority__c,
                    subassignments: [] // Empty subassignments array for now
                }))
            ),
        };
       
        createAssignment({ assignmentWrapper: parentAssignmentsData.assignmentWrapper })
            .then((createdParentAssignments) => {
                console.log('Parent Assignments Saved:', createdParentAssignments);
                const parentAssignmentIds = createdParentAssignments
                .filter(assignment => !assignment.parentId)
                .map(assignment => assignment.Id);


                // Update the existing rows with the returned data
                for (let i = 0; i < createdParentAssignments.length; i++) {
                    const assignmentIndex = this.findIndexById(createdParentAssignments[i].Id);
                    if (assignmentIndex !== -1) {
                        this.assignments[assignmentIndex] = createdParentAssignments[i];
                    }
                }

                // Save subassignments (if any)
                const subassignments = this.assignments.reduce((acc, assignment) => {
                    if (assignment.subassignments && assignment.subassignments.length > 0) {
                        acc.push(...assignment.subassignments.map(subassignment => ({
                            assignmentName: subassignment.Name,
                            relatedTo: subassignment.Related_To__c,
                            assignedTo: subassignment.Assigned_To__c,
                            subject: subassignment.Subject__c,
                            status: subassignment.Status__c,
                            priority: subassignment.Priority__c,
                            dueDate:subassignment.Due_Date__c,
                             assignmentType:subassignment.Assignment_Type__c,
                            parentAssignment: subassignment.Parent_Assignment__c,
                            
                        }))); 
                    }
                        // Toast message for parent assignment.
                        const event = new ShowToastEvent
                       ({
                          title: 'success',
                          message: 'Successfully  created the Parent record!',
                          variant: 'success',
                        });
                        this.dispatchEvent(event);

                    return acc;
                }, []);
                console.log('Subassignment Data 478:',JSON.stringify(subassignments));
                if (subassignments.length > 0) {
                    const subassignmentsData = {
                        assignmentWrapper: JSON.stringify(subassignments),
                    };

                    createAssignment({ assignmentWrapper: subassignmentsData.assignmentWrapper })
                        .then(() => {
                            console.log('Subassignments Saved');

                            // Toast message for sub assignment.
                            const event = new ShowToastEvent
                           ({
                              title: 'success',
                              message: 'Successfully  created the child record!',
                              variant: 'success',
                            });
                            this.dispatchEvent(event);

                            return this.refreshData();
                        })
                        .catch((subassignmentError) => {
                            console.error('Error creating subassignments:', subassignmentError);

                           // for error toast msg for sub assinments.
                            setTimeout(()=>{
                              const event = new ShowToastEvent
                              ({
                                 title: 'Error',
                                 message: 'Sub Assignment is not created, Try again!',
                                 variant: 'Error',
                              });
                              this.dispatchEvent(event);
                            },2000);

                        });

                } else {
                    console.log('No Subassignments to save.');
                    return this.refreshData();
                }
            })
            .catch((parentAssignmentError) => {
                console.error('Error creating parent assignments:', parentAssignmentError);
                //ERROR Toast message for parent assignment.
                const event = new ShowToastEvent
                ({
                   title: 'Error',
                   message: 'Please fill the required fields, Try again!',
                   variant: 'Error',
                 });
                 this.dispatchEvent(event);
            });
    } else {
        console.error('Error: No assignments to save.');
        const event = new ShowToastEvent
                ({
                   title: 'Error',
                   message: 'Please add the assignment first, Try agian!',
                   variant: 'Error',
                 });
        this.dispatchEvent(event);
    }
}

// Deletion




    
}











//.filter(subassignment => subassignment.parentId === assignment.Id)








// updateFieldOptions(rowId, fieldName, options) {
//     const index = this.findIndexById(rowId);
//     console.log('Inside updateFieldOptions');
//     console.log('Row Id:', rowId);
//     console.log('Field Name:', fieldName);
//     console.log('Options:', JSON.stringify(options));
//     console.log('inside updateFieldOptions',JSON.stringify(options));
//     if (fieldName in this.assignments[index]) {
//         this.assignments[index][Assigned_To__cOptions] = options;
//         console.log( 'hvctdf',JSON.stringify(this.assignments[index][Assigned_To__cOptions]));
//     } else {
//         const subIndex = this.findIndexById(rowId, index);
//         if (subIndex !== -1 && fieldName in this.assignments[index].subassignments[subIndex]) {
//             this.assignments[index].subassignments[subIndex][Assigned_To__cOptions] = options;
//         }
//     }
// }

















// THIS CODE IS FOR HANDLING THE VALUES IN DROPDOWNCHANGE OF STATUS AND PRIORITY

// handleDropdownChange(rowId, parentId, field, value) {
    //     if (field === 'Status__c') {
    //         const newPicklistValues = this.statusOptions; // Use the statusOptions obtained via wire
    //         this.updateFieldAndPicklistValues(rowId, field, value, newPicklistValues);
    //     } else if (field === 'Priority__c') {
    //         const newPicklistValues = this.priorityOptions; // Use the priorityOptions obtained via wire
    //         this.updateFieldAndPicklistValues(rowId, field, value, newPicklistValues);
    //     }
    // }
    
    // updateFieldAndPicklistValues(rowId, field, value, picklistValues) {
    //     this.assignments = this.assignments.map(assignment => {
    //         if (assignment.Id === rowId) {
    //             return {
    //                 ...assignment,
    //                 [field]: value,
    //                 [`${field}PicklistValues`]: picklistValues
    //             };
    //         }
    //         return assignment;
    //     });
    // }