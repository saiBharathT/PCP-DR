public class UserCreationHandler {
    @future
    public static void createUserAsync(Set<Id> newTeamMemberIds) {
        List<Team_Member__c> newTeamMembers = [SELECT Id, Name, Email__c, Project__c, Employee__c FROM Team_Member__c WHERE Id IN :newTeamMemberIds];
        
        List<User> userList = new List<User>();
        List<User> existingUserList = new List<User>(); // List to hold existing users for update
        Set<String> existingEmployeeIds = new Set<String>(); // Store existing Employee IDs

        // Fetch existing users' Employee IDs
        for (User existingUser : [SELECT Id, Project_ID__c FROM User WHERE Project_ID__c IN :getEmployeeIds(newTeamMembers)]) {
            existingEmployeeIds.add(existingUser.Project_ID__c);
            existingUserList.add(existingUser); // Add existing user to the list
        }

        List<Profile> profileList = [SELECT Id FROM Profile WHERE Name = 'Identity User'];

        for (Team_Member__c Team : newTeamMembers) {
            // Check if Employee ID already exists, if so, skip creating the user
            if (existingEmployeeIds.contains(Team.Employee__c)) {
                continue;
            }

            User u = new User();
            u.LastName = Team.Name;
            u.Email = Team.Email__c;
            u.Username = Team.Name + Team.Project__c + '8@gmail.com';
            u.Alias = 'test';
            u.IsActive = true;
            u.TimeZoneSidKey = 'GMT';
            u.LanguageLocaleKey = 'en_US';
            u.EmailEncodingKey = 'UTF-8';
            u.LocaleSidKey = 'en_US';
            u.Project_ID__c = Team.Employee__c;

            if (profileList.size() > 0) {
                u.ProfileId = profileList[0].Id;
                userList.add(u);
            }
        }
        
        // Insert new users
        if (!userList.isEmpty()) {
            insert userList;
        }
        
        // Update existing users to set IsActive to true
        for (User existingUser : existingUserList) {
            existingUser.IsActive = true;
        }
        if (!existingUserList.isEmpty()) {
            update existingUserList;
        }
    }

    // Helper method to get unique Employee IDs from Team_Member__c records
    private static Set<String> getEmployeeIds(List<Team_Member__c> teamMembers) {
        Set<String> employeeIds = new Set<String>();
        for (Team_Member__c member : teamMembers) {
            employeeIds.add(member.Employee__c);
        }
        return employeeIds;
    }
}