@extends('layouts.app')

@section('content')
    <!-- Basic Data Tables -->
    <!--===================================================-->
    <div class="panel">
        <div class="panel-heading bord-btm clearfix pad-all h-100">
            <h3 class="panel-title pull-left pad-no">{{translate('Affiliate Withdraw Request')}}</h3>
        </div>
        <div class="panel-body">
            <table class="table table-striped res-table mar-no" cellspacing="0" width="100%">
                <thead>
                <tr>
                    <th>#</th>
                    <th>{{translate('Date')}}</th>
                    <th>{{translate('Name')}}</th>
                    <th>{{translate('Email')}}</th>
                    <th>{{translate('Amount')}}</th>
                    <th>{{translate('Status')}}</th>
                    <th>{{translate('options')}}</th>
                </tr>
                </thead>
                <tbody>
                @foreach($affiliate_withdraw_requests as $key => $affiliate_withdraw_request)
                @php $status = $affiliate_withdraw_request->status ; @endphp
                    <tr>
                        <td>{{ ($key+1) + ($affiliate_withdraw_requests->currentPage() - 1)*$affiliate_withdraw_requests->perPage() }}</td>
                        <td>{{ $affiliate_withdraw_request->created_at}}</td>
                        <td>{{ $affiliate_withdraw_request->user->name}}</td>
                        <td>{{ $affiliate_withdraw_request->user->email}}</td>
                        <td>{{ single_price($affiliate_withdraw_request->amount)}}</td>
                        <td>
                            @if($status == 1)
                                <span class="ml-2" style="color:green"><strong>{{ translate('Approved') }}</strong></span>
                            @elseif($status == 2)
                                <span class="ml-2" style="color:red"><strong>{{ translate('Rejected') }}</strong></span>
                            @else
                                <span class="ml-2" style="color:blue"><strong> {{ translate('Pending') }}</strong></span>
                            @endif
                        </td>
                        <td>
                            @if($status == 0)
                            <div class="btn-group dropdown">
                                <button class="btn btn-primary dropdown-toggle dropdown-toggle-icon" data-toggle="dropdown" type="button">
                                    {{ translate('Actions')}} <i class="dropdown-caret"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-right">
                                    <li><a onclick="show_affiliate_withdraw_modal('{{$affiliate_withdraw_request->id}}');">{{ translate('Pay Now')}}</a></li>
                                    <li><a onclick="affiliate_withdraw_reject_modal('{{route('affiliate.withdraw_request.reject', $affiliate_withdraw_request->id)}}');">{{translate('Reject')}}</a></li>
                                </ul>
                            </div>
                            @else
                                {{ translate('No Action Available')}}
                            @endif
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table>
            <div class="clearfix">
                <div class="pull-right">
                    {{ $affiliate_withdraw_requests->links() }}
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="affiliate_withdraw_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content" id="modal-content">

            </div>
        </div>
    </div>

    <div class="modal fade" id="affiliate_withdraw_reject_modal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-zoom product-modal" id="modal-size" role="document">
            <div class="modal-content position-relative">
                <div class="modal-header">
                    <h5 class="modal-title strong-600 heading-5">{{ translate('Affiliate Withdraw Request Reject')}}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body gry-bg px-3 pt-3">
                    <p>{{translate('Are you sure, You want to reject this?')}}</p>
                </div>
                <div class="modal-footer">
                    <a id="reject_link" class="btn btn-danger btn-ok">{{translate('Reject')}}</a>
                </div>
            </div>
        </div>
    </div>

@endsection


@section('script')
    <script type="text/javascript">
        function show_affiliate_withdraw_modal(id){
            $.post('{{ route('affiliate_withdraw_modal') }}',{_token:'{{ @csrf_token() }}', id:id}, function(data){
                $('#affiliate_withdraw_modal #modal-content').html(data);
                $('#affiliate_withdraw_modal').modal('show', {backdrop: 'static'});
                $('.demo-select2-placeholder').select2();
            });
        }
        function affiliate_withdraw_reject_modal(reject_link){
            $('#affiliate_withdraw_reject_modal').modal('show');
            document.getElementById('reject_link').setAttribute('href' , reject_link);
        }

    </script>
@endsection
