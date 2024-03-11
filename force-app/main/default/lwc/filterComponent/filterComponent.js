import { LightningElement,track,api } from 'lwc';
import LightningModal from 'lightning/modal';
export default class FilterComponent extends LightningModal 
{ 
  @track flag=false;
  @api checkspinnerflag;
  Experience = 0; 
  name = null;
  value = null;

  get options() {
      return [
          { label: 'BA', value: 'BA' },
          { label: 'Consultant', value: 'Consultant' },
          { label: 'Developer', value: 'Developer' },
          { label: 'Finance', value: 'Finance' },
          { label: 'HR', value: 'HR' },
          { label: 'Lead Consultant', value: 'Lead Consultant' },
          { label: 'Sr. Developer', value: 'SrDeveloper'},
          { label: 'QA', value: 'QA' },
          { label: 'Tecnical Architect', value: 'Tecnical Architect'}
      ];
  }
  handleClick()
  {
    this.flag = true;
    console.log("falg : ",this.flag);
  }
  handleName(event)
  {
    this.name = event.detail.value;
    console.log('name: ',this.name);
  }
  handleExperience(event)
  {
    this.Experience = event.detail.value;
    console.log('eexperience : ',this.Experience);
  }
  handleChange(event) {
      this.value = event.detail.value;
      // this.dispatchEvent(new CustomEvent('getdata',{detail:value}));
  }
  saveAll()
  {
    this.dispatchEvent(new CustomEvent('getdata',{detail:{role: this.value, experience : this.Experience, name : this.name}}));
    this.value = null;
    this.Experience = 0;
    this.name = null;
}
}