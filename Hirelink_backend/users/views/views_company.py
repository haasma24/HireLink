# users/views/views_company.py
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response

from users.models import Entreprise
from users.serializers.entreprise_serializer import EntrepriseSerializer


class RecruiterCompanyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Return the company linked to the logged‑in recruiter.
        """
        user = request.user

        if getattr(user, "role", None) != "recruiter":
            return Response(
                {"detail": "Only recruiters have a company profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            entreprise = Entreprise.objects.get(recruiter=user)
        except Entreprise.DoesNotExist:
            return Response(
                {"detail": "Company not found for this recruiter."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EntrepriseSerializer(entreprise)
        return Response(serializer.data)

    def put(self, request):
        """
        Update the company linked to the logged‑in recruiter.
        """
        user = request.user

        if getattr(user, "role", None) != "recruiter":
            return Response(
                {"detail": "Only recruiters can update a company profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            entreprise = Entreprise.objects.get(recruiter=user)
        except Entreprise.DoesNotExist:
            # If for some reason it does not exist, create it
            entreprise = Entreprise.objects.create(recruiter=user)

        serializer = EntrepriseSerializer(entreprise, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)
