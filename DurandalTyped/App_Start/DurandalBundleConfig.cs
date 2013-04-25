using System;
using System.Web.Optimization;
using DurandalTyped.App_Start;

namespace DurandalTyped
{
    public class DurandalBundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.IgnoreList.Clear();
            AddDefaultIgnorePatterns(bundles.IgnoreList);

            var views = new Bundle("~/AppViews")
                .IncludeDirectory("~/App/views", "*.html");
            views.Transforms.Add(new AmdTextTransform());

            bundles.Add(
              new ScriptBundle("~/scripts/vendor")
                .Include("~/Scripts/jquery-{version}.js")
                .Include("~/Scripts/knockout-{version}.js")
                .Include("~/Scripts/sammy-{version}.js")
                .Include("~/Scripts/bootstrap.min.js")
                .Include("~/App/main-built.js")

                );

            bundles.Add(views);

            bundles.Add(
              new ScriptBundle("~/scripts/App")
                .Include("~/App/viewmodels/*.js")
                .Include("~/App/durandalts/*.js")
                .Include("~/App/Startup.js")
              );


            bundles.Add(
              new StyleBundle("~/Content/css")
                .Include("~/Content/ie10mobile.css")
                .Include("~/Content/bootstrap.min.css")
                .Include("~/Content/bootstrap-responsive.min.css")
                .Include("~/Content/font-awesome.min.css")
                .Include("~/Content/durandal.css")
                .Include("~/Content/app.css")
              );
        }

        public static void AddDefaultIgnorePatterns(IgnoreList ignoreList)
        {
            if (ignoreList == null)
            {
                throw new ArgumentNullException("ignoreList");
            }

            ignoreList.Ignore("*.intellisense.js");
            ignoreList.Ignore("*-vsdoc.js");
            ignoreList.Ignore("*.debug.js", OptimizationMode.WhenEnabled);
            //ignoreList.Ignore("*.min.js", OptimizationMode.WhenDisabled);
            //ignoreList.Ignore("*.min.css", OptimizationMode.WhenDisabled);
        }
    }
}