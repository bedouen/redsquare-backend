# reports/urls.py
from django.urls import path
from .views import (
    SalesDashboardView, 
    GlobalOverviewView, 
    SalesReportPDFView,
    ExportTableView,
    ExportSectionView,
    ExportChartsView,
    ChartsDataView,
    SalesDetailView  # ✅ Ajouter cet import
)

urlpatterns = [
    path("sales-dashboard/", SalesDashboardView.as_view(), name="sales-dashboard"),
    path("global-overview/", GlobalOverviewView.as_view(), name="global-overview"),
    path("sales-pdf/", SalesReportPDFView.as_view(), name="sales-pdf"),
    path("export-table-pdf/", ExportTableView.as_view(), name="export-table-pdf"),
    path("export-section-pdf/", ExportSectionView.as_view(), name="export-section-pdf"),
    path("export-charts-pdf/", ExportChartsView.as_view(), name="export-charts-pdf"),
    path("charts-data/", ChartsDataView.as_view(), name="charts-data"),
    path("sales-detail/", SalesDetailView.as_view(), name="sales-detail"),  # ✅ Ajouter cette route
]