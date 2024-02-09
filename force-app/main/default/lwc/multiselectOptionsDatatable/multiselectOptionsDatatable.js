import { LightningElement,track,wire,api} from 'lwc';
import getAccounts from '@salesforce/apex/getAccountsRecord.getAccounts';
import createTeamMembers from '@salesforce/apex/getAccountsRecord.createTeamMembers';
import getTeamMembers from '@salesforce/apex/fetchTeamMemberRecords.getTeamMembers';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import LightningModal from 'lightning/modal';

// Cloumns that are to be shown in the first datatable....//
const column = [{label:'Name',fieldName:'Name'},
                {label:'Role',fieldName:'Role__c'},
                {label:'Experience',fieldName:'Experience__c'},
                {  
                    label:'Action',
                    type: 'button',
                    typeAttributes: {
                        rowActions: [{label:'Add',name:'AddMember'}],
                        menuAlignment: 'right',
                        variant:'brand',
                        iconName:'utility:add'
                    }
                }];
export default class MultiselectOptionsDatatable extends LightningModal
{ 
  @api recordId;
  @track isButtonDisabled = false;// for create team member button.
  @track accounts;//list of all the contact.
  @track columns = column;// columns for the datatable.
  @track showSelectedAccounts = [];//for the second datatable for showing the selected team members.
  @track selectedColumns;// for the second datatable .
  @track flag = false;//for disbale the second datatable if no values are there.
  @api flagdata = false;
  @track value; //role combobox.
  @track experience;//experience comboobx.
  @track name;//search team member name input field.
  @track checkSpinner = false;//for spinner
  @track datatableContainerStyle = 'height: 35px';//for Dynamic styling.
  @track showNoRecordsMessage = true;
  @track NoRecordFound = false;
  @track headerCount = 'No Team Member Selected';
    //............getting all the records on the basise of the filter values................//
  @wire(getAccounts,{ratingValue:'$value',exp :'$experience',Empname : '$name'})
  wiredAccounts({data,error})
  {
    if(data)
    {  
      //......for spinner..............
      this.checkSpinner = true;
      this.NoRecordFound = false;
      setTimeout(() => {
        this.checkSpinner = false;
        this.accounts = data;
        this.datatableContainerStyle = this.accounts.length > 0 ? 'height: 150px' : 'height: 35px';
        if(this.accounts.length == 0)
        {
           this.NoRecordFound = true;
        }
        console.log(data);
      },800)
      // this.accounts = data;
      // console.log(data);
    }
    else if(error)
    {
      console.log(error);
    }
  }
  //................for Selecting the Team Members for a specific Project......................//
  handleRowActionForSelection(event)
  { 

    const actionName = event.detail.action.name;
    const row = event.detail.row;
    console.log('row ID : ',row);
    console.log('Action : ',actionName);
    let count = 0;
    for(let i=0; i<this.showSelectedAccounts.length; i++)
    {
      if(this.showSelectedAccounts[i].Id == row.Id)
      {
         count++;
      }
    }
    if(count == 0)
    {
      this.showSelectedAccounts.push(row);
    }
    this.flag = true;
    if(this.showSelectedAccounts.length == 0)
    {
      this.headerCount = 'No Team Member Selected';
    }
    else
    {
      this.headerCount = this.showSelectedAccounts.length + ' Team Member Selected';
    }
  }

  //selected team membres will be visible in the below datatable so if we do-not want a team member to be there so we remove from here...//

  handleRemoveMember(event)
  { 
    let object = event.target.value;
    console.log('removed : ',object);
    let index = this.showSelectedAccounts.map(obj => obj.Id).indexOf(event.target.value);
    console.log('index : ',index);
    if (index !== -1) 
    {
      this.showSelectedAccounts.splice(index,1);
    }
    if(this.showSelectedAccounts.length == 0)
    {
      this.flag = false;
    }
    if(this.showSelectedAccounts.length == 0)
    {
      this.headerCount = 'No Team Member Selected';
    }
    else
    {
      this.headerCount = this.showSelectedAccounts.length + ' Team Member Selected';
    }
    console.log(this.showSelectedAccounts);
    refreshApex(this.showSelectedAccounts);
  }

  //After selecting the desired team members we can create them permanantly it means they are added to the project.
  handleCreateTeamMember()
  { 
    const numberOfTeamMembers = this.showSelectedAccounts.length;
    console.log('Line-76=>',JSON.stringify(this.showSelectedAccounts));
    
   // crete team member apex method called .
    createTeamMembers({contactList : this.showSelectedAccounts, project_Id : this.recordId})
    .then(result=>
      {
          console.log('success: ',result);
          const event = new ShowToastEvent({
            title: 'Success',
            message: `${numberOfTeamMembers} Team Members are Successfully Created.`,
            variant: 'success',
          });
          this.dispatchEvent(event);
          
          // Notify second component to refresh
          const messagePayload = { refresh: true };
          publish(this.messageContext, MY_MESSAGE_CHANNEL, { messagePayload });

          // location.reload();
      })
    // .catch(error =>
    //   {
    //     // console.log('size',error.size());
    //     if(error.)
    //     {
    //       console.log('failure : ',JSON.stringify(error));
    //     const event = new ShowToastEvent
    //     ({
    //       title: 'Error',
    //       message: 'No Team Member is Created, Try Again !',
    //       variant: 'Error',
    //     });
    //     this.dispatchEvent(event);
    //     }
    //   })
    .catch(error => {
      if (error && (error.length !== undefined && error.length !== 0)) {
          console.log('failure: ', JSON.stringify(error));
          const event = new ShowToastEvent({
              title: 'Error',
              message: 'No Team Member is Created, Try Again!',
              variant: 'Error',
          });
          this.dispatchEvent(event);
      }
   })
      .finally(() => 
      {
        // Enable the button regardless of success or failure
        this.flag = false;
        this.flagdata = true;
        this.showSelectedAccounts = [];
        this.headerCount = 'No Team Member Selected';
      });
  }
  //For handling the filter value ..
  handleTheChildData(event)
  {
    this.value = event.detail.role;
    this.experience = event.detail.experience;
    this.name = event.detail.name;
    this.showNoRecordsMessage = false;
    console.log(this.value);
    console.log(this.experience);
    console.log(this.name);
  }
}