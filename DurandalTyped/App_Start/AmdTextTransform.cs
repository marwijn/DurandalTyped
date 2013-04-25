using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Optimization;

namespace DurandalTyped.App_Start
{
    public class AmdTextTransform : IBundleTransform
    {
        public void Process(BundleContext context, BundleResponse response)
        {
            var builder = new StringBuilder();
            foreach (var file in response.Files)
            {
                var fileStream = file.OpenRead();
                var reader = new StreamReader(fileStream);
                var text = reader.ReadToEnd();

                text = HttpUtility.JavaScriptStringEncode(text);

                builder.Append("define('text!views/");
                builder.Append(file.Name);
                builder.Append("', [], function () { return '");
                builder.Append(text);
                builder.AppendLine("'; });");
            }

            response.ContentType = "text/javascript";
            response.Content = builder.ToString();
        }
    }
}