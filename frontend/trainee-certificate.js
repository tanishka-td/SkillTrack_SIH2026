document.addEventListener(
    "DOMContentLoaded",
    () => {

        const download =
            document.getElementById(
                "downloadCertificate"
            );

        const share =
            document.getElementById(
                "shareCertificate"
            );


        download.addEventListener(
            "click",
            () => {

                alert(
                    "Certificate download functionality will be connected to the certificate service."
                );

            }
        );


        share.addEventListener(
            "click",
            async () => {

                const text =
                    "SkillTrack Certificate - Web Development - ST-CERT-48291";


                if (
                    navigator.share
                ) {

                    try {

                        await navigator.share({
                            title:
                                "SkillTrack Certificate",

                            text:
                                text
                        });

                    }
                    catch (error) {

                        console.log(error);

                    }

                }

                else {

                    try {

                        await navigator.clipboard.writeText(
                            text
                        );

                        alert(
                            "Certificate details copied."
                        );

                    }
                    catch {

                        alert(
                            text
                        );

                    }

                }

            }
        );

    }
);