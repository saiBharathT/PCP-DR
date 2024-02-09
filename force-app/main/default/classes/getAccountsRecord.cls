public with sharing class getAccountsRecord 
{
   // handles fiter present on the datatable according to that it gives the results.
    @AuraEnabled(cacheable=true)
    public static list<contact> getAccounts(string ratingValue,Integer exp,string Empname) 
    {   
        String teamMemberName = '%' + Empname + '%';
        String query = 'SELECT Id, Name, Role__c, Experience__c, Email FROM Contact WHERE ';
        Boolean isFirstCondition = true;
        // when all the values are NULL.
        if(Empname == null && ratingValue == null && exp == 0)
        {
            return [SELECT Id, Name, Role__c, Experience__c,Email FROM Contact WHERE Role__c != NULL ORDER BY Name];
        }
        //when all the values are filled.
        if(ratingValue != null && exp != 0 && Empname != null)
        {
           return [SELECT Id, Name, Role__c, Experience__c,Email FROM Contact WHERE Role__c =: ratingValue AND Experience__c =: exp AND Name LIKE : teamMemberName ORDER BY Name];  
        }
        //when only single value is given... 
        if (Empname != null && (ratingValue == null && exp == 0)) {
            query += 'Name LIKE : teamMemberName';
            isFirstCondition = false; 
        }

        if (ratingValue != null && (Empname == null && exp == 0)) {
            if (!isFirstCondition) {
                query += ' OR ';
            }
            query += 'Role__c =:ratingValue';
            isFirstCondition = false;
        }

        if (exp != 0 && (Empname == null && ratingValue == null)) {
            if (!isFirstCondition) 
            {
                query += ' OR ';
            }
            query += 'Experience__c =:exp';
            isFirstCondition = false;
        }
        ///when any two of the values are given but any of the value is not given.
        if(exp != 0 && ratingValue != null && Empname == null)
        {
            if(!isFirstCondition){
                query += 'OR';
            }
            query += 'Role__c =:ratingValue AND Experience__c =:exp ';
            isFirstCondition = false;
        }
        if(exp != 0 && Empname != null && ratingValue == null)
        {
           if(!isFirstCondition)
           {
            query += 'OR';
           }
           query += 'Experience__c =:exp AND Name LIKE: teamMemberName';
           isFirstCondition = false;
        }
        if(ratingValue != null && Empname != null && exp == 0)
        {
           if(!isFirstCondition)
           {
            query += 'OR';
           }
           query += 'Role__c =:ratingValue AND Name LIKE: teamMemberName';
        }

        // query += 'ORDER BY Name';
        List<Contact> result = Database.query(query);
        return result;
    }

   // for creating the team members.
    @AuraEnabled
public static Boolean createTeamMembers(List<contact> contactList,Id project_Id) 
{    

    try {
        List<team_member__c> newTeamMembers = new List<team_member__c>();
        list<team_member__c> teamMemberList = [SELECT Id, Name, project__c FROM team_member__c];
        //for handling whether the records that is selected by the user is already present in the database or not if yes 
        //then not to create otherwise create that. 
        Integer count = 0;
        for(Integer i=0; i<contactList.size(); i++)
       {   
        count = 0;
        for(team_member__c tm : teamMemberList)
        {
          if(tm.name == contactList[i].name && tm.Project__c == project_Id)
          {
            count++;
          }
        }
        // simultaneously check that the selected records should be created only once.
        if(count == 0)
        {
            Team_Member__c tm = new Team_Member__c(
                name = contactList[i].name,
                role__c = contactList[i].role__c,
                Project__c = project_Id,
                Total_Experience__c = contactList[i].Experience__c,
                Email__c = contactList[i].Email,
                Employee__c = contactList[i].Id
            );
            newTeamMembers.add(tm); 
        }
       }
        insert newTeamMembers;
    } catch (Exception e) {
        // Handle any exceptions or errors during the DML operation
        System.debug('Error creating contacts: ' + e.getMessage());
        return false;
    }

    return true;
}
}