@extends('layouts.app')

@section('content')

<div class="panel">
    <div class="panel-heading bord-btm clearfix pad-all h-100">
        <h3 class="panel-title pull-left pad-no">{{translate('Offline Seller Package Payment Requests')}}</h3>
    </div>
    <div class="panel-body">
        <table class="table table-striped res-table mar-no" cellspacing="0" width="100%">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{translate('Name')}}</th>
                    <th>{{translate('Package')}}</th>
                    <th>{{translate('Method')}}</th>
                    <th>{{translate('TXN ID')}}</th>
                    <th>{{translate('Reciept')}}</th>
                    <th>{{translate('Approval')}}</th>
                    <th>{{translate('Date')}}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($package_payment_requests as $key => $package_payment_request)
                    @if ($package_payment_request->user != null)
                        <tr>
                            <td>{{ ($key+1) }}</td>
                            <td>{{ $package_payment_request->user->name}}</td>
                            <td>{{ $package_payment_request->seller_package->name }}</td>
                            <td>{{ $package_payment_request->payment_method }}</td>
                            <td>{{ $package_payment_request->payment_details }}</td>
                            <td>
                                @if ($package_payment_request->reciept != null)
                                    <a href="{{ my_asset($package_payment_request->reciept) }}" target="_blank">{{translate('Open Reciept')}}</a>
                                @endif
                            </td>
                            <td>
                                <label class="switch">
                                    @if($package_payment_request->approval == 1)
                                        <input type="checkbox" checked disabled>
                                    @else
                                        <input onchange="offline_payment_approval(this)" id="payment_approval" value="{{ $package_payment_request->id }}" type="checkbox">
                                    @endif
                                    <span class="slider round"></span>
                                </label>
                            </td>
                            <td>{{ $package_payment_request->created_at }}</td>
                        </tr>
                    @endif
                @endforeach
            </tbody>
            {{ $package_payment_requests->links() }}
        </table>
    </div>
</div>

@endsection
@section('script')
    <script type="text/javascript">
        function offline_payment_approval(el){
            if(el.checked){
                var status = 1;
            }
            else{
                var status = 0;
            }
            $.post('{{ route('offline_seller_package_payment.approved') }}', {_token:'{{ csrf_token() }}', id:el.value, status:status}, function(data){
                if(data == 1){
                    $( "#payment_approval" ).prop( "disabled", true );
                    showAlert('success', 'Offline Seller Package Payment approved successfully');
                }
                else{
                    showAlert('danger', 'Something went wrong');
                }
            });
        }
    </script>
@endsection
