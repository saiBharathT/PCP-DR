public with sharing class AssignmentCreationHandler {
    public class AssignmentWrapper {
        @AuraEnabled public String assignmentName;
        @AuraEnabled public String relatedTo;
        @AuraEnabled public String assignedTo;
        @AuraEnabled public String subject;
        @AuraEnabled public String status;
        @AuraEnabled public String priority;
        @AuraEnabled public Date dueDate; 
        @AuraEnabled public String assignmentType;
        @AuraEnabled public String parentAssignment;
        @AuraEnabled public List<SubassignmentWrapper> subassignments;
    }


    public class SubassignmentWrapper {
        @AuraEnabled public String assignmentName;
        @AuraEnabled public String relatedTo;
        @AuraEnabled public String assignedTo;
        @AuraEnabled public String subject;
        @AuraEnabled public String status;
        @AuraEnabled public String priority;
        @AuraEnabled public String assignmentType; 
        @AuraEnabled public Date dueDate; 
        @AuraEnabled public String parentAssignment; 

    }

    @AuraEnabled(cacheable=true)
    public static List<Project__c> getProjectDetails(Id recordId) {
        if (recordId != null) {
            return [SELECT Id, Name FROM Project__c WHERE Id = :recordId];
        } else {
            return [SELECT Id, Name FROM Project__c];
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Team_Member__c> getRelatedTeamMembers(Id projectId) { 
                String teamMemberQuery = 'SELECT Id, Name FROM Team_Member__c WHERE Project__c = :projectId';
                return Database.query(teamMemberQuery);
            }

    @AuraEnabled(cacheable=true)
    public static List<Assignment__c> getParentAssignments() {
        return [SELECT Id, Name FROM Assignment__c];
    }

    @AuraEnabled
    public static List<Assignment__c> createAssignment(String assignmentWrapper) {
    System.debug('assignmentWrapper' + assignmentWrapper);
    List<Assignment__c> assignmentsToInsert = new List<Assignment__c>();
    List<Assignment__c> subassignmentsToInsert = new List<Assignment__c>();
    List<AssignmentWrapper> assignmentWrapperList = (List<AssignmentWrapper>) JSON.deserialize(assignmentWrapper, List<AssignmentWrapper>.class);
    System.debug('assignmentWrapperlist' + assignmentWrapperList);
    Map<String, Id> assignmentIdMap = new Map<String, Id>();
    Map<String, Id> subassignmentIdMap = new Map<String, Id>();

    // Extract assignment names from AssignmentWrapper objects
    Set<String> assignmentNames = new Set<String>();
    for (AssignmentWrapper assignmentData : assignmentWrapperList) {
        assignmentNames.add(assignmentData.assignmentName);
        if (assignmentData.subassignments != null && !assignmentData.subassignments.isEmpty()) {
            for (SubassignmentWrapper subassignmentData : assignmentData.subassignments) {
                assignmentNames.add(subassignmentData.assignmentName);
            }
        }
    }

    // Check for existing assignments and populate assignmentIdMap
    for (Assignment__c assignment : [SELECT Id, Name FROM Assignment__c WHERE Name IN :assignmentNames]) {
        assignmentIdMap.put(assignment.Name, assignment.Id);
    }

    // Insert parent assignments if they don't already exist
    for (AssignmentWrapper assignmentData : assignmentWrapperList) {
        if (!assignmentIdMap.containsKey(assignmentData.assignmentName)) {
            Assignment__c parentAssignment = new Assignment__c(
                
                Name = assignmentData.assignmentName,
                Related_To__c = assignmentData.relatedTo,
                Assigned_To__c = assignmentData.assignedTo,
                Subject__c = assignmentData.subject,
                Status__c = assignmentData.status,
                Priority__c = assignmentData.priority,
                Due_Date__c = assignmentData.dueDate,
                Assignment_Type__c = assignmentData.assignmentType,
                Parent_Assignment__c=assignmentData.parentAssignment
            );
            assignmentsToInsert.add(parentAssignment);
        }
    }

    // Insert new parent assignments
    if (!assignmentsToInsert.isEmpty()) {
        insert assignmentsToInsert;    
    }
        return assignmentsToInsert;
    }



    // DELETION FUNCTION
    // @AuraEnabled
    // public static void deleteAssignmentAndSubassignment(String assignmentId, List<String> subassignmentIds) {
    //     // assignmentId is not null
    //     if (String.isNotBlank(assignmentId)) {
    //         List<Assignment__c> assignmentsToDelete = new List<Assignment__c>();
    //         List<Assignment__c> subassignmentsToDelete = new List<Assignment__c>();

    //         // Query assignment to delete
    //         Assignment__c assignment = [SELECT Id, Parent_Assignment__c FROM Assignment__c WHERE Id = :assignmentId LIMIT 1];

    //         if (assignment != null) {
    //             if (subassignmentIds != null && !subassignmentIds.isEmpty()) {
    //                 // If subassignmentIds is provided, delete only the specified subassignments
    //                 subassignmentsToDelete = [SELECT Id FROM Assignment__c WHERE Id IN :subassignmentIds];
    //             } else {
    //                 // If subassignmentIds is not provided, delete the assignment and its subassignments
    //                 assignmentsToDelete.add(assignment);
    //                 if (String.isBlank(assignment.Parent_Assignment__c)) {
    //                     // If it's a parent assignment, also delete its subassignments
    //                     subassignmentsToDelete = [SELECT Id FROM Assignment__c WHERE Parent_Assignment__c = :assignment.Id];
    //                 }
    //             }
    //         }

    //         // Delete subassignments first
    //         if (!subassignmentsToDelete.isEmpty()) {
    //             delete subassignmentsToDelete;
    //         }

    //         // Delete assignments
    //         if (!assignmentsToDelete.isEmpty()) {
    //             delete assignmentsToDelete;
    //         }
    //     }
    // }


}









// // Insert subassignments
    // for (AssignmentWrapper assignmentData : assignmentWrapperList) {
    //     if (assignmentData.subassignments != null && !assignmentData.subassignments.isEmpty()) {
    //         for (SubassignmentWrapper subassignmentData : assignmentData.subassignments) {
    //             if (!assignmentIdMap.containsKey(subassignmentData.assignmentName)) {
    //                 if (String.isNotBlank(assignmentData.assignmentName)) { 
    //                     System.debug('Parent Assignment ID not found for: ' + assignmentIdMap.get(assignmentData.assignmentName));
    //                     Assignment__c subassignment = new Assignment__c(
    //                         Name = subassignmentData.assignmentName,
    //                         Related_To__c = subassignmentData.relatedTo,
    //                         Assigned_To__c = subassignmentData.assignedTo,
    //                         Subject__c = subassignmentData.subject,
    //                         Status__c = subassignmentData.status,
    //                         Priority__c = subassignmentData.priority,
    //                         Parent_Assignment__c = assignmentIdMap.get(assignmentData.assignmentName)
    //                     );
    //                     subassignmentsToInsert.add(subassignment);
    //                 } else {
    //                     System.debug('Assignment Name is null or empty.');
    //                     // Handle this case based on your requirements
    //                 }
    //             } else {
    //                 System.debug('Subassignment already exists: ' + subassignmentData.assignmentName);
    //                 // Handle this case based on your requirements
    //             }
    //         }

    //         // Insert subassignments and clear the list afterwards
    //         if (!subassignmentsToInsert.isEmpty()) {
    //             insert subassignmentsToInsert;
    //             subassignmentsToInsert.clear(); // Clear the list after insertion
    //         }
    //     }
    //}












































// public class AssignmentCreationHandler {

//     public class AssignmentWrapper {
//         @AuraEnabled public List<ParentAssignmentWrapper> assignments;
//     }

//     public class ParentAssignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public Id relatedTo; 
//         @AuraEnabled public Id assignedTo; 
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status;
//         @AuraEnabled public String priority;
//         @AuraEnabled public List<SubassignmentWrapper> subassignments; 
//     }

//     public class SubassignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public Id assignedTo;
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status;
//         @AuraEnabled public String priority;
//         @AuraEnabled public Id parentId;
//     }

//     @AuraEnabled(cacheable=true)
//     public static List<Team_Member__c> getRelatedTeamMembers(Id projectId) { 
//         String teamMemberQuery = 'SELECT Id, Name FROM Team_Member__c WHERE Project__c = :projectId';
//         return Database.query(teamMemberQuery);
//     }

//     @AuraEnabled(cacheable=true)
//     public static List<Project__c> getProjectDetails()
//     {
//         String projects = 'SELECT Id, Name FROM Project__c'; 
//         System.debug(projects);  
//         return Database.query(projects);
//     }

//     @AuraEnabled(cacheable=true)
//     public static List<AssignmentCreationHandler.AssignmentWrapper> createAssignment(AssignmentCreationHandler.AssignmentWrapper assignmentWrapper) {
//     List<Assignment__c> assignmentsToInsert = new List<Assignment__c>();
//     List<Assignment__c> subassignmentsToInsert = new List<Assignment__c>();
//     Map<String, Assignment__c> parentAssignments = new Map<String, Assignment__c>();
//         system.debug('assignmentWrapper'+assignmentWrapper);
//     if (assignmentWrapper != null && assignmentWrapper.assignments != null) {
//         for (ParentAssignmentWrapper parentAssignmentWrapper : assignmentWrapper.assignments) {
//             Assignment__c parentAssignment = new Assignment__c(
//                 Name = parentAssignmentWrapper.assignmentName,
//                 Assigned_To__c = parentAssignmentWrapper.assignedTo,
//                 Subject__c = parentAssignmentWrapper.subject,
//                 Status__c = parentAssignmentWrapper.status,
//                 Priority__c = parentAssignmentWrapper.priority,
//                 Related_To__c = parentAssignmentWrapper.relatedTo
//             );

//             assignmentsToInsert.add(parentAssignment);
//             parentAssignments.put(parentAssignmentWrapper.assignmentName, parentAssignment);

//             if (parentAssignmentWrapper.subassignments != null && !parentAssignmentWrapper.subassignments.isEmpty()) {
//                 for (SubassignmentWrapper subassignmentWrapper : parentAssignmentWrapper.subassignments) {
//                     Assignment__c subassignment = new Assignment__c(
//                         Name = subassignmentWrapper.assignmentName, 
//                         Assigned_To__c = subassignmentWrapper.assignedTo,
//                         Subject__c = subassignmentWrapper.subject,
//                         Status__c = subassignmentWrapper.status,
//                         Priority__c = subassignmentWrapper.priority
//                     );

//                     if (parentAssignment != null) {
//                         subassignment.Related_To__c = parentAssignment.Id;
//                     }

//                     subassignmentsToInsert.add(subassignment);
//                 }
//             }
//         }
//     }
//     System.debug('Assignments to insert: ' + assignmentsToInsert);
//     System.debug('Subassignments to insert: ' + subassignmentsToInsert);


    
//     try {
//         if (!assignmentsToInsert.isEmpty()) {
//             insert assignmentsToInsert;
//         }    
//     } catch (Exception e) {
//         System.debug('DML Error: ' + e.getMessage());
//     }

//     if (!subassignmentsToInsert.isEmpty()) {
//         insert subassignmentsToInsert;
//     }

//     System.debug('Assignments created: ' + assignmentsToInsert);

//     return new List<AssignmentCreationHandler.AssignmentWrapper>{ assignmentWrapper };
// }

// }




























// public class AssignmentCreationHandler {

//     public class AssignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public Id relatedTo; 
//         @AuraEnabled public Id assignedTo; 
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status;
//         @AuraEnabled public String priority; 
//         @AuraEnabled public List<SubassignmentWrapper> subassignments;

//         public AssignmentWrapper() {
//             this.subassignments = new List<SubassignmentWrapper>();
//         }

//         public AssignmentWrapper(String assignmentName, Id assignedTo, String subject, String status, String priority, Id relatedTo) {
//             this.assignmentName = assignmentName;
//             this.relatedTo = relatedTo;
//             this.assignedTo = assignedTo;
//             this.subject = subject;
//             this.status = status;
//             this.priority = priority;
//             this.subassignments = new List<SubassignmentWrapper>();
//         }
//     }

//     public class SubassignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public Id assignedTo; // Change data type to Id for lookup fields
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status; // Change data type to String for picklist fields
//         @AuraEnabled public String priority; // Change data type to String for picklist fields

//         public SubassignmentWrapper(String assignmentName, Id assignedTo, String subject, String status, String priority) {
//             this.assignmentName = assignmentName;
//             this.assignedTo = assignedTo;
//             this.subject = subject;
//             this.status = status;
//             this.priority = priority;
//         }
//     }

//     @AuraEnabled(cacheable=true)
//     public static List<Team_Member__c> getRelatedTeamMembers(Id projectId) { 
//         String teamMemberQuery = 'SELECT Id, Name FROM Team_Member__c WHERE Project__c = :projectId';
//         return Database.query(teamMemberQuery);
//     }

//     @AuraEnabled
//     public static List<AssignmentWrapper> createAssignment(List<AssignmentWrapper> assignments) {
//         List<Assignment__c> assignmentsToInsert = new List<Assignment__c>();
//         List<Assignment__c> subassignmentsToInsert = new List<Assignment__c>();
//         Map<String, Assignment__c> parentAssignments = new Map<String, Assignment__c>();

//         for (AssignmentWrapper assignmentWrapper : assignments) {
//             Assignment__c parentAssignment = new Assignment__c(
//                 Name = assignmentWrapper.assignmentName,
//                 Assigned_To__c = assignmentWrapper.assignedTo,
//                 Subject__c = assignmentWrapper.subject,
//                 Status__c = assignmentWrapper.status,
//                 Priority__c = assignmentWrapper.priority,
//                 Related_To__c = assignmentWrapper.relatedTo
//             );

//             assignmentsToInsert.add(parentAssignment);
//             parentAssignments.put(assignmentWrapper.assignmentName, parentAssignment);

//             if (assignmentWrapper.subassignments != null && !assignmentWrapper.subassignments.isEmpty()) {
//                 for (SubassignmentWrapper subassignmentWrapper : assignmentWrapper.subassignments) {
//                     Assignment__c subassignment = new Assignment__c(
//                         Name = subassignmentWrapper.assignmentName, 
//                         Assigned_To__c = subassignmentWrapper.assignedTo,
//                         Subject__c = subassignmentWrapper.subject,
//                         Status__c = subassignmentWrapper.status,
//                         Priority__c = subassignmentWrapper.priority,
//                         Related_To__c = parentAssignment.Id
//                     );

//                     subassignmentsToInsert.add(subassignment);
//                 }
//             }
//         }

//         if (!assignmentsToInsert.isEmpty()) {
//             insert assignmentsToInsert;
//         }

//         if (!subassignmentsToInsert.isEmpty()) {
//             insert subassignmentsToInsert;
//         }

//         return assignments;
//     }
// }




















// public with sharing class AssignmentCreationHandler {

//     public class AssignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public String assignedTo;
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status;
//         @AuraEnabled public String priority;
//         @AuraEnabled public String relatedTo;
//         @AuraEnabled public List<SubassignmentWrapper> subassignments;

//         public AssignmentWrapper() {
//             this.subassignments = new List<SubassignmentWrapper>();
//         }
//     }

//     public class SubassignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public String assignedTo;
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status;
//         @AuraEnabled public String priority;
//     }

//         @AuraEnabled(cacheable=true)
//         public static List<Team_Member__c> getRelatedTeamMembers(String projectId) {
//             String teamMemberQuery = 'SELECT Id, Name FROM Team_Member__c WHERE Project__c = :projectId';
//             return Database.query(teamMemberQuery);
//         }
    

//         @AuraEnabled
//         public static List<AssignmentWrapper> createAssignment(List<AssignmentWrapper> assignments) {
//             List<Assignment__c> assignmentsToInsert = new List<Assignment__c>();
//             List<Assignment__c> subassignmentsToInsert = new List<Assignment__c>();
//             Map<String, Assignment__c> parentAssignments = new Map<String, Assignment__c>();
    
//             for (AssignmentWrapper assignmentWrapper : assignments) {
//                 Assignment__c parentAssignment = parentAssignments.get(assignmentWrapper.assignmentName);
    
//                 if (parentAssignment == null) {
//                     parentAssignment = new Assignment__c(
//                         Name = assignmentWrapper.assignmentName,
//                         Assigned_To__c = assignmentWrapper.assignedTo,
//                         Subject__c = assignmentWrapper.subject,
//                         Status__c = assignmentWrapper.status,
//                         Priority__c = assignmentWrapper.priority,
//                         Related_To__c = assignmentWrapper.relatedTo
//                     );
    
//                     parentAssignments.put(assignmentWrapper.assignmentName, parentAssignment);
//                     assignmentsToInsert.add(parentAssignment);
//                 }
    
//                 Assignment__c subassignment = new Assignment__c(
//                     Name = assignmentWrapper.assignmentName, 
//                     Assigned_To__c = assignmentWrapper.assignedTo,
//                     Subject__c = assignmentWrapper.subject,
//                     Status__c = assignmentWrapper.status,
//                     Priority__c = assignmentWrapper.priority,
//                     Related_To__c = parentAssignment.Id
//                 );
    
//                 subassignmentsToInsert.add(subassignment);
//             }
    
//             if (!assignmentsToInsert.isEmpty()) {
//                 Database.SaveResult[] parentInsertResults = Database.insert(assignmentsToInsert, false);
//             }
    
//             if (!subassignmentsToInsert.isEmpty()) {
//                 Database.SaveResult[] subInsertResults = Database.insert(subassignmentsToInsert, false);
//             }
    
//             return assignments;
//         }
//     }
    
    //     // Create parent assignments
    // @AuraEnabled(cacheable=true)
    // public static List<AssignmentWrapper> createAssignment(List<AssignmentWrapper> assignments) {
    //     List<Assignment__c> parentAssignmentsToInsert = new List<Assignment__c>();
    //     List<Assignment__c> subassignmentsToInsert = new List<Assignment__c>();
    //     Map<String, Assignment__c> parentAssignmentsMap = new Map<String, Assignment__c>();

    //     // Create parent assignments and subassignments
    //     for (AssignmentWrapper assignmentWrapper : assignments) {
    //         Assignment__c parentAssignment = parentAssignmentsMap.get(assignmentWrapper.assignmentName);

    //         if (parentAssignment == null) {
    //             // Create parent assignment if it doesn't exist
    //             parentAssignment = new Assignment__c(
    //                 Name = assignmentWrapper.assignmentName,
    //                 Assigned_To__c = assignmentWrapper.assignedTo,
    //                 Subject__c = assignmentWrapper.subject,
    //                 Status__c = assignmentWrapper.status,
    //                 Priority__c = assignmentWrapper.priority,
    //                 Related_To__c = assignmentWrapper.relatedTo
    //             );

    //             parentAssignmentsMap.put(assignmentWrapper.assignmentName, parentAssignment);
    //             parentAssignmentsToInsert.add(parentAssignment);
    //         }

    //         // Create subassignment
    //         Assignment__c subassignment = new Assignment__c(
    //             Name = assignmentWrapper.assignmentName, // or use a different field
    //             Assigned_To__c = assignmentWrapper.assignedTo,
    //             Subject__c = assignmentWrapper.subject,
    //             Status__c = assignmentWrapper.status,
    //             Priority__c = assignmentWrapper.priority,
    //             Related_To__c = parentAssignment.Id
    //         );

    //         subassignmentsToInsert.add(subassignment);
    //     }

    //     // Insert parent assignments
    //     if (!parentAssignmentsToInsert.isEmpty()) {
    //         insert parentAssignmentsToInsert;
    //     }

    //     // Insert subassignments
    //     if (!subassignmentsToInsert.isEmpty()) {
    //         insert subassignmentsToInsert;
    //     }

    //     return assignments;
    // }
















    // @AuraEnabled(cacheable=true)
    // public static List<AssignmentWrapper> createAssignment(List<AssignmentWrapper> assignments) {
    //     List<Assignment__c> assignmentsToInsert = new List<Assignment__c>();
        
    //     // Create a map to store the parent assignments by name
    //     Map<String, Assignment__c> parentAssignmentMap = new Map<String, Assignment__c>();

    //     for (AssignmentWrapper assignmentWrapper : assignments) {
    //         Assignment__c assignment = new Assignment__c(
    //             Name = assignmentWrapper.assignmentName,
    //             Assigned_To__c = assignmentWrapper.assignedTo,
    //             Subject__c = assignmentWrapper.subject,
    //             Status__c = assignmentWrapper.status,
    //             Priority__c = assignmentWrapper.priority,
    //             Related_To__c = assignmentWrapper.relatedTo
    //         );
            
    //         assignmentsToInsert.add(assignment);

    //         // Add parent assignment to the map
    //         parentAssignmentMap.put(assignmentWrapper.assignmentName, assignment);
    //     }

    //     if (!assignmentsToInsert.isEmpty()) {
    //         insert assignmentsToInsert;

    //         // Create a list to store subassignments
    //         List<Assignment__c> subassignmentsToInsert = new List<Assignment__c>();

    //         for (AssignmentWrapper assignmentWrapper : assignments) {
    //             // Retrieve the parent assignment from the map
    //             Assignment__c parentAssignment = parentAssignmentMap.get(assignmentWrapper.assignmentName);
    //         }

    //             for (SubassignmentWrapper subassignmentWrapper : assignmentWrapper.subassignments) {
    //                 Assignment__c subassignment = new Assignment__c(
    //                     Name = subassignmentWrapper.assignmentName,
    //                     Assigned_To__c = subassignmentWrapper.assignedTo,
    //                     Subject__c = subassignmentWrapper.subject,
    //                     Status__c = subassignmentWrapper.status,
    //                     Priority__c = subassignmentWrapper.priority,
    //                     Related_To__c = parentAssignment.Id
    //                 );
    //                 subassignmentsToInsert.add(subassignment);
    //             }
    //         }

    //         if (!subassignmentsToInsert.isEmpty()) {
    //             insert subassignmentsToInsert;
    //         }
    //     }

    //     return assignments;
    // }

















// public with sharing class AssignmentCreationHandler {

//     public class AssignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public String assignedTo;
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status;
//         @AuraEnabled public String priority;
//         @AuraEnabled public String relatedTo;
//         @AuraEnabled public List<SubassignmentWrapper> subassignments;

//         public AssignmentWrapper() {
//             this.subassignments = new List<SubassignmentWrapper>();
//         }
//     }

//     public class SubassignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public String assignedTo;
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status;
//         @AuraEnabled public String priority;
//     }

//     @AuraEnabled(cacheable=true)
//     public static List<AssignmentWrapper> createAssignment(List<AssignmentWrapper> assignments) {
//         List<Assignment__c> assignmentsToInsert = new List<Assignment__c>();
//         //List<Assignment__c> subassignmentsToInsert = new List<Assignment__c>();

//         for (AssignmentWrapper assignmentWrapper : assignments) {
//             Assignment__c assignment = new Assignment__c(
//                 Name = assignmentWrapper.assignmentName,
//                 Assigned_To__c = assignmentWrapper.assignedTo,
//                 Subject__c = assignmentWrapper.subject,
//                 Status__c = assignmentWrapper.status,
//                 Priority__c = assignmentWrapper.priority,
//                 Related_To__c = assignmentWrapper.relatedTo
//             );
//             assignmentsToInsert.add(assignment);
//         }

//         if (!assignmentsToInsert.isEmpty()) {
//             //insert assignmentsToInsert;

//             for (Integer i = 0; i < assignments.size(); i++) {
//                 AssignmentWrapper assignmentWrapper = assignments[i];
//                 List<Assignment__c> parentAssignments = [SELECT Id FROM Assignment__c WHERE Name = :assignmentWrapper.assignmentName LIMIT 1];
                
//                 if (!parentAssignments.isEmpty()) {
//                     for (SubassignmentWrapper subassignmentWrapper : assignmentWrapper.subassignments) {
//                         Assignment__c subassignment = new Assignment__c(
//                             Name = subassignmentWrapper.assignmentName,
//                             Assigned_To__c = subassignmentWrapper.assignedTo,
//                             Subject__c = subassignmentWrapper.subject,
//                             Status__c = subassignmentWrapper.status,
//                             Priority__c = subassignmentWrapper.priority,
//                             Related_To__c = parentAssignments[0].Id
//                         );
//                         assignmentsToInsert.add(subassignment);
//                     }
//                 }
//             }

//             insert assignmentsToInsert;

//         }

//         return assignments;
//     }
    
// }












//  public class AssignmentCreationHandler {

//     @AuraEnabled
//     public static void createAssignment(List<AssignmentWrapper> assignments) {
//         List<Assignment__c> assignmentRecords = new List<Assignment__c>();

//         for (AssignmentWrapper assignmentWrapper : assignments) {
//             Assignment__c assignment = new Assignment__c(
//                 Name = assignmentWrapper.assignmentName,
//                 Assigned_To__c = assignmentWrapper.assignedTo,
//                 Subject__c = assignmentWrapper.subject,
//                 Status__c = assignmentWrapper.status,
//                 Priority__c = assignmentWrapper.priority,
//                 Related_To__c = assignmentWrapper.relatedTo
//             );

//             assignmentRecords.add(assignment);
//             system.debug(assignmentRecords);

            

//             for (SubassignmentWrapper subassignmentWrapper : assignmentWrapper.subassignments) {
//                 Assignment__c subassignment = new Assignment__c(
//                     Name = subassignmentWrapper.assignmentName,
//                     Assigned_To__c = subassignmentWrapper.assignedTo,
//                     Subject__c = subassignmentWrapper.subject,
//                     Status__c = subassignmentWrapper.status,
//                     Priority__c = subassignmentWrapper.priority,
//                     Related_To__c = subassignmentWrapper.relatedTo,
//                     Parent_Assignment__c = assignment.Id
//                 );

//                 assignmentRecords.add(subassignment);
//             }
//         }

//         insert assignmentRecords;
//         system.debug(assignmentRecords);
//     }


//     @AuraEnabled
//     public static void saveAssignments(List<Assignment__c> assignments) {
//         System.debug('Entering saveAssignments method');
//         update assignments;
//     }


//     public class AssignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public String assignedTo;
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status;
//         @AuraEnabled public String priority;
//         @AuraEnabled public String relatedTo;
//         //@AuraEnabled public List<SubassignmentWrapper> subassignments;
//     }

//     public class SubassignmentWrapper {
//         @AuraEnabled public String assignmentName;
//         @AuraEnabled public String assignedTo;
//         @AuraEnabled public String subject;
//         @AuraEnabled public String status;
//         @AuraEnabled public String priority;
//         @AuraEnabled public String relatedTo;
//     }
// }