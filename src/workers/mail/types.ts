export interface MailEnvelope {
    to: string;
    subject: string;
    text: string;
    html: string;
    template: string;
    link: string;
    creator: string;
    title: string;
    transactionLink?: string;
    thumbnail?: string;
    consignMessage: string;
    vaultExplorer?: string;
    mintExplorer?: string;
    username?: string;
    wallet?: string;
    currentDate?: string;
}

export interface MailEnvelopeWithoutTemplate {
    to: string;
    subject: string;
    html: string;
}

export interface MailProvider {
    /**
     * @param mail MailToSend
     * @returns string id of the mail sent
     */
    sendMail(mail: MailEnvelope): Promise<string>;
    sendMailWithoutTemplate(mail: MailEnvelopeWithoutTemplate): Promise<string>;
}
