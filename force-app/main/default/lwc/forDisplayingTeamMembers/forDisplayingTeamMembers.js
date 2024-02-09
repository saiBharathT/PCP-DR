import { LightningElement,track,wire,api } from 'lwc';
import getTeamMembers from '@salesforce/apex/fetchTeamMemberRecords.getTeamMembers';
import removeTeamMember from '@salesforce/apex/fetchTeamMemberRecords.removeTeamMember';
import { NavigationMixin } from 'lightning/navigation';
import {refreshApex} from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class ForDisplayingTeamMembers extends NavigationMixin(LightningElement)
{    
    @track combineObject;
    @track checkSpinner = false;
    @track teamMemberList;
    @track setHeightOftheDiv = '3  5px';
    @track teamMemberListFlag = false;
    @track headerCount;
    @api recordId; // Current project's Id
    @api flagValue;
   
    columns = [
      { label: 'Name', fieldName: 'accLink', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
      { label: 'Role', fieldName: 'Role__c', type: 'text' },
      { label: 'Experience', fieldName: 'Total_Experience__c'}];
  

    //..........Getting the Team Members From Apex Class................ 

    @wire(getTeamMembers, { projectId: '$recordId' }) teamMembers(result)
    {  
       this.combineObject = result;
       if(result.data)
       { 
         console.log('team members : ',JSON.stringify(result.data));
           //.......For hyperlink.............
          result.data = JSON.parse(JSON.stringify(result.data));
          console.log('new employee  : ', result.data.employee__c);
          result.data.forEach(res => 
            {
              res.accLink = '/' + res.Employee__c;
            });

        //.....for spinner............... 
        this.checkSpinner = true;
        setTimeout(() => {
          this.checkSpinner = false;
          this.teamMemberList = result.data;
          console.log(this.teamMemberList);
          this.setHeightOftheDiv = this.teamMemberList.length > 0 ? 'height: 150px' : 'height: 35px';
          this.teamMemberListFlag = false;
          this. headerCount = this.teamMemberList.length + ' Team Member';
          if(this.teamMemberList.length == 0)
          {
            this.teamMemberListFlag = true;
          }
          console.log('Flag :  ',this.flagValue);
        },800)

       }
       else
       {
          console.log(result.error);
       }
    };  
  //...............Deleting the records of the team members.................
deleteRecord()
{  
    var selectedRecords =  this.template.querySelector("lightning-datatable").getSelectedRows();  

        
    let countOfDeletedTeamMembers = selectedRecords.length;
      removeTeamMember({teamMemberList: selectedRecords})  

      .then(result=>{  
          let singleTeamMember = `${countOfDeletedTeamMembers} Team Member is Successfully Deleted !`;

          if(countOfDeletedTeamMembers == 1)
          {
            console.log('done');
            const event = new ShowToastEvent({
              title: 'Success',
              message: singleTeamMember,
              variant: 'success',
            });
              this.dispatchEvent(event);
              refreshApex(this.combineObject); 
          }
          else if(countOfDeletedTeamMembers == 0)
          {
            const event = new ShowToastEvent({
              title: 'Error',
              message: 'You need to select team members first, Try Again !',
              variant: 'Error',
            });
            this.dispatchEvent(event);
          }
          else
          {
            console.log('done');
            const event = new ShowToastEvent({
              title: 'Success',
              message: `${countOfDeletedTeamMembers} Team Members are Successfully Deleted !`,
              variant: 'success',
            });
              this.dispatchEvent(event);
              refreshApex(this.combineObject);
              console.log('flag : ',this.flagValue); 
        } 
        // else
        // {
        //   const event = new ShowToastEvent({
        //     title: 'Error',
        //     message: 'Something went wrong ! Try Again',
        //     variant: 'Error',
        //   });
        //   this.dispatchEvent(event);
        // }
      })  
      .catch(error=>{  
        // alert('Cloud not delete'+JSON.stringify(error)); 
        const event = new ShowToastEvent({
          title: 'Error',
          message: `You can't delete record because the assigned task is not yet completed! Try Again`,
          variant: 'Error',
        });
         
        this.dispatchEvent(event); 
      })
  }
  handleRefreshMetod()
  { 
    // console.log('got this from parent : ',this.retrivedDataFromParent);
    refreshApex(this.combineObject);
  }

  // connectedCallback() {
  //   // Call a function at a regular interval
  //   setInterval(()=>{
  //     refreshApex(this.combineObject);
  //   }, 1000);
  // }
}