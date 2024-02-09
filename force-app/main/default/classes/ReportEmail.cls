public class ReportEmail{
    @future(callout=true)
    public static void sendreport(){
        List<Messaging.EmailFileAttachment>attachments=new List<Messaging.EmailFileAttachment>();
        List<Report>reportList=[Select Id,DeveloperName,Name From Report where DeveloperName=:Label.Report_Name];
        if(reportList.size()>0){
            for(Report report:reportList){
                String reportId=(String)report.Id;
                String reportName=(string)report.Name;
                ApexPages.PageReference objPage=new ApexPages.PageReference('/servlet/PrintableViewDownloadServlet?isdtp=p1&reportId='+reportId);
                Messaging.EmailFileAttachment objMsgEmailAttach=new Messaging.EmailFileAttachment();
                objMsgEmailAttach.setFileName(reportName+'.csv');
                if(!Test.isRunningTest())
                    objMsgEmailAttach.setBody(objPage.getContent());
                objMsgEmailAttach.setContentType('text/csv');
                attachments.add(objMsgEmailAttach);
            }
        }
        
        Messaging.SingleEmailMessage mail=new Messaging.SingleEmailMessage();
        mail.setUseSignature(false);
        mail.setToAddresses(new List<String>{Label.Mail_to_the_ProjectManager});
        String todayDate = String.valueOf(Date.today().day()) + '/' + String.valueOf(Date.today().month()) + '/' + String.valueOf(Date.today().year());
        mail.setSubject('Daily Project Status Report from Salesforce - '+todayDate);
        mail.setHtmlBody(Label.Email_Body);
        mail.setFileAttachments(attachments);
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] {mail});
        System.debug('Line-1'+ mail);
    }
}